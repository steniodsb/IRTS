// ==========================================================================
// checkout — cria sessões de Stripe Checkout (assinatura / curso / livro)
// verify_jwt = true
//
// Body:
//   { type: 'subscription', plan_slug }             → mode 'subscription'
//   { type: 'course', course_id }                   → mode 'payment'
//   { type: 'book', book_id, quantity?, shipping_address? } → mode 'payment'
//
// Para course/book cria orders (pending) + order_items ANTES, e passa
// order_id + user_id no metadata da sessão (usado pelo webhook).
//
// action=cancel (query ou body): cancela a assinatura ativa do usuário ao
// fim do período (cancel_at_period_end=true) e marca no banco.
//
// Retorna { url } (checkout do Stripe) ou erro claro.
// ==========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, requireUser, AuthError } from "../_shared/supabaseAdmin.ts";

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return jsonResponse(
        {
          error:
            "STRIPE_SECRET_KEY não configurada. Defina o secret antes de criar " +
            "sessões de checkout (supabase secrets set STRIPE_SECRET_KEY=...).",
        },
        500,
      );
    }

    const { user } = await requireUser(req);
    const admin = createAdminClient();
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const siteUrl =
      Deno.env.get("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const action = url.searchParams.get("action") || body.action;

    // ---------------------------------------------------------------
    // CANCELAMENTO de assinatura (ao fim do período)
    // ---------------------------------------------------------------
    if (action === "cancel") {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("id, provider_subscription_id, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (!sub?.provider_subscription_id) {
        return jsonResponse({ error: "Nenhuma assinatura ativa encontrada." }, 404);
      }

      await stripe.subscriptions.update(sub.provider_subscription_id, {
        cancel_at_period_end: true,
      });
      await admin
        .from("subscriptions")
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("id", sub.id);

      return jsonResponse({ canceled: true, at_period_end: true });
    }

    // ---------------------------------------------------------------
    // CRIAÇÃO de sessão de checkout
    // ---------------------------------------------------------------
    const { type } = body;
    const successUrl = `${siteUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/checkout/cancelado`;

    if (type === "subscription") {
      const { plan_slug } = body;
      if (!plan_slug) {
        return jsonResponse({ error: "Campo 'plan_slug' é obrigatório." }, 400);
      }

      const { data: plan } = await admin
        .from("plans")
        .select("id, slug, stripe_price_id, interval")
        .eq("slug", plan_slug)
        .eq("active", true)
        .maybeSingle();

      if (!plan) {
        return jsonResponse({ error: "Plano não encontrado." }, 404);
      }

      // Preço: usa o do plano; senão faz fallback pelos STRIPE_PRICE_* por intervalo.
      let priceId = plan.stripe_price_id as string | null;
      if (!priceId) {
        if (plan.interval === "year") priceId = Deno.env.get("STRIPE_PRICE_ANUAL") ?? null;
        else if (plan.interval === "month") priceId = Deno.env.get("STRIPE_PRICE_MENSAL") ?? null;
      }
      if (!priceId) {
        return jsonResponse(
          { error: "Plano sem stripe_price_id e sem STRIPE_PRICE_* correspondente." },
          400,
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: user.id,
        metadata: { user_id: user.id, plan_id: plan.id, plan_slug: plan.slug },
        subscription_data: { metadata: { user_id: user.id, plan_id: plan.id } },
      });

      return jsonResponse({ url: session.url });
    }

    if (type === "course" || type === "book") {
      const quantity = Math.max(1, parseInt(body.quantity, 10) || 1);
      let productTable: "courses" | "books";
      let productId: string;
      if (type === "course") {
        productId = body.course_id;
        productTable = "courses";
      } else {
        productId = body.book_id;
        productTable = "books";
      }
      if (!productId) {
        return jsonResponse(
          { error: `Campo '${type === "course" ? "course_id" : "book_id"}' é obrigatório.` },
          400,
        );
      }

      const { data: product } = await admin
        .from(productTable)
        .select("id, title, price_cents")
        .eq("id", productId)
        .maybeSingle();
      if (!product) {
        return jsonResponse({ error: "Produto não encontrado." }, 404);
      }

      const unitPrice = product.price_cents ?? 0;
      const totalCents = unitPrice * quantity;

      // 1. Cria pedido pendente
      const { data: order, error: orderErr } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total_cents: totalCents,
          currency: "BRL",
          provider: "stripe",
          shipping_address: type === "book" ? body.shipping_address ?? null : null,
          metadata: { type, product_id: productId },
        })
        .select("id")
        .single();
      if (orderErr) {
        return jsonResponse(
          { error: "Falha ao criar pedido.", detail: orderErr.message },
          500,
        );
      }

      // 2. Cria item do pedido
      const { error: itemErr } = await admin.from("order_items").insert({
        order_id: order.id,
        product_type: type, // 'course' | 'book'
        product_id: productId,
        title: product.title,
        quantity,
        unit_price_cents: unitPrice,
      });
      if (itemErr) {
        return jsonResponse(
          { error: "Falha ao criar item do pedido.", detail: itemErr.message },
          500,
        );
      }

      // 3. Sessão de pagamento único
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "brl",
              unit_amount: unitPrice,
              product_data: { name: product.title },
            },
            quantity,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: user.id,
        metadata: { user_id: user.id, order_id: order.id, type },
        payment_intent_data: {
          metadata: { user_id: user.id, order_id: order.id },
        },
      });

      return jsonResponse({ url: session.url, order_id: order.id });
    }

    return jsonResponse(
      { error: "Campo 'type' inválido. Use 'subscription', 'course' ou 'book'." },
      400,
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonResponse({ error: e.message }, 401);
    }
    console.error("checkout erro:", e);
    return jsonResponse(
      { error: "Erro interno.", detail: String((e as Error)?.message ?? e) },
      500,
    );
  }
});
