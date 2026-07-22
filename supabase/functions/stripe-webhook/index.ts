// ==========================================================================
// stripe-webhook — recebe eventos do Stripe
// verify_jwt = false  (o Stripe não envia JWT; validamos pela assinatura)
//
// Eventos tratados:
//  - checkout.session.completed / payment_intent.succeeded
//        → marca orders.status='paid' (dispara trigger on_order_paid:
//          matrícula automática + notificações).
//  - customer.subscription.created / updated
//        → upsert em subscriptions (status, period end, ids, plano via price).
//  - customer.subscription.deleted
//        → subscriptions.status='canceled' + notificação 'subscription_canceled'.
//
// Sempre responde 200 rápido (erros de processamento são logados).
// ==========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16?target=deno";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUB_ACTIVE = ["trialing", "active", "past_due", "canceled", "incomplete"];

/** Mapeia o status do Stripe para o enum sub_status do banco. */
function mapSubStatus(stripeStatus: string): string {
  const s = stripeStatus === "incomplete_expired" ? "incomplete" : stripeStatus;
  return SUB_ACTIVE.includes(s) ? s : "incomplete";
}

/** Descobre o plan_id a partir do price id da assinatura. */
async function planIdFromPrice(
  admin: SupabaseClient,
  priceId: string | null | undefined,
): Promise<string | null> {
  if (!priceId) return null;
  const { data } = await admin
    .from("plans")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle();
  return data?.id ?? null;
}

/** Localiza o usuário dono da assinatura (por metadata ou provider_customer_id). */
async function resolveUserId(
  admin: SupabaseClient,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const metaUser = (sub.metadata?.user_id as string) || null;
  if (metaUser) return metaUser;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (customerId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("provider_customer_id", customerId)
      .maybeSingle();
    if (data?.user_id) return data.user_id;
  }
  return null;
}

async function upsertSubscription(admin: SupabaseClient, sub: Stripe.Subscription) {
  const userId = await resolveUserId(admin, sub);
  if (!userId) {
    console.warn(`Assinatura ${sub.id} sem user_id resolvível; ignorando upsert.`);
    return;
  }
  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const planId = await planIdFromPrice(admin, priceId);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  const row = {
    user_id: userId,
    plan_id: planId,
    status: mapSubStatus(sub.status),
    provider: "stripe",
    provider_subscription_id: sub.id,
    provider_customer_id: customerId ?? null,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  // Upsert por provider_subscription_id (busca manual → update ou insert).
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("provider_subscription_id", sub.id)
    .maybeSingle();

  if (existing) {
    await admin.from("subscriptions").update(row).eq("id", existing.id);
  } else {
    await admin.from("subscriptions").insert(row);
  }
}

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return jsonResponse(
      {
        error:
          "STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET não configurados. Defina os " +
          "secrets antes de receber webhooks do Stripe.",
      },
      500,
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature ?? "",
      webhookSecret,
    );
  } catch (err) {
    console.error("Assinatura do webhook inválida:", (err as Error).message);
    return jsonResponse({ error: "Assinatura inválida." }, 400);
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Só tratamos pagamentos únicos aqui; assinaturas via eventos de subscription.
        if (session.mode === "payment") {
          const orderId = session.metadata?.order_id;
          if (orderId) {
            await admin
              .from("orders")
              .update({
                status: "paid",
                provider_payment_id:
                  (session.payment_intent as string) ?? session.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderId)
              .neq("status", "paid");
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await admin
            .from("orders")
            .update({
              status: "paid",
              provider_payment_id: pi.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .neq("status", "paid");
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await upsertSubscription(admin, event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(admin, sub);
        await admin
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: false,
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", sub.id);

        await admin.from("notifications").insert({
          audience: "owner",
          type: "subscription_canceled",
          title: "Assinatura cancelada",
          body: "Uma assinatura foi cancelada.",
          data: { subscription_id: sub.id, user_id: userId },
        });
        break;
      }

      default:
        // Evento não tratado — apenas registra.
        console.log(`Evento Stripe ignorado: ${event.type}`);
    }
  } catch (e) {
    // Loga mas responde 200 para o Stripe não reenviar em loop por erro nosso.
    console.error(`Erro ao processar ${event.type}:`, (e as Error).message);
  }

  return jsonResponse({ received: true });
});
