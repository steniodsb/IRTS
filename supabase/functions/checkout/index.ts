// ==========================================================================
// checkout — cobranças e assinaturas no Asaas (PIX, boleto e cartão)
// verify_jwt = true
//
// O checkout é NATIVO: a função devolve os dados do pagamento (QR Code do PIX,
// linha digitável do boleto ou o resultado do cartão) para a própria interface
// do site exibir — o aluno não é redirecionado para fora da plataforma.
//
// Body:
//   { type:'subscription', plan_slug, method, payer, card? }
//   { type:'course', course_id, method, payer, card? }
//   { type:'book', book_id, quantity?, shipping_address?, method, payer, card? }
//
//   method : 'pix' | 'boleto' | 'credit_card'
//   payer  : { name, cpfCnpj, phone?, postalCode?, addressNumber?, complement? }
//   card   : { holderName, number, expiryMonth, expiryYear, ccv }  (só cartão)
//
// action=status (query): consulta a situação de um pedido/assinatura — usado
//   pelo polling da tela de PIX.
// action=cancel (query): cancela a assinatura. O acesso segue até o fim do
//   período já pago (current_period_end).
// ==========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, requireUser, AuthError } from "../_shared/supabaseAdmin.ts";
import {
  asaas,
  AsaasError,
  AsaasNaoConfigurado,
  boletoDaCobranca,
  CobrancaAsaas,
  cpfCnpjValido,
  garantirCliente,
  ipDoCliente,
  METODO_PARA_BILLING,
  MetodoInterno,
  pixDaCobranca,
  soDigitos,
  STATUS_PAGO,
  vencimento,
} from "../_shared/asaas.ts";

/** Dias para vencer o boleto (o PIX vence no mesmo dia). */
const DIAS_BOLETO = 3;

type Corpo = Record<string, any>;

/** Valida o bloco `payer` vindo do site. */
function validarPagador(payer: Corpo | undefined, metodo: MetodoInterno) {
  if (!payer?.name || String(payer.name).trim().length < 3) {
    return "Informe o nome completo do pagador.";
  }
  if (!cpfCnpjValido(payer.cpfCnpj ?? "")) {
    return "CPF/CNPJ inválido.";
  }
  // O Asaas exige endereço para transações de cartão (antifraude).
  if (metodo === "credit_card") {
    if (soDigitos(payer.postalCode).length !== 8) return "Informe um CEP válido.";
    if (!payer.addressNumber) return "Informe o número do endereço.";
    if (soDigitos(payer.phone).length < 10) return "Informe um telefone com DDD.";
  }
  return null;
}

/** Bloco de cartão no formato do Asaas (usado em cobrança e assinatura). */
function blocoCartao(body: Corpo, email: string | undefined, req: Request) {
  const c = body.card ?? {};
  const p = body.payer ?? {};
  return {
    creditCard: {
      holderName: c.holderName,
      number: soDigitos(c.number),
      expiryMonth: String(c.expiryMonth ?? "").padStart(2, "0"),
      expiryYear: String(c.expiryYear ?? "").length === 2
        ? `20${c.expiryYear}`
        : String(c.expiryYear ?? ""),
      ccv: soDigitos(c.ccv),
    },
    creditCardHolderInfo: {
      name: c.holderName || p.name,
      email: p.email || email,
      cpfCnpj: soDigitos(p.cpfCnpj),
      postalCode: soDigitos(p.postalCode),
      addressNumber: String(p.addressNumber ?? ""),
      addressComplement: p.complement || undefined,
      phone: soDigitos(p.phone),
      mobilePhone: soDigitos(p.phone),
    },
    remoteIp: ipDoCliente(req),
  };
}

/** Monta a resposta com o que a tela precisa mostrar para cada método. */
async function detalhesDoPagamento(cobranca: CobrancaAsaas, metodo: MetodoInterno) {
  const pago = STATUS_PAGO.includes(cobranca.status);
  const base = {
    payment_id: cobranca.id,
    method: metodo,
    status: pago ? "paid" : cobranca.status === "PENDING" || cobranca.status === "AWAITING_RISK_ANALYSIS" ? "pending" : "failed",
    asaas_status: cobranca.status,
    value_cents: Math.round((cobranca.value ?? 0) * 100),
    due_date: cobranca.dueDate,
    invoice_url: cobranca.invoiceUrl ?? null,
  };

  if (metodo === "pix" && !pago) {
    try {
      return { ...base, pix: await pixDaCobranca(cobranca.id) };
    } catch (e) {
      console.error("Falha ao obter QR Code do PIX:", (e as Error).message);
      return base; // a tela cai no link da fatura
    }
  }
  if (metodo === "boleto" && !pago) {
    try {
      const b = await boletoDaCobranca(cobranca.id);
      return { ...base, boleto: { ...b, url: cobranca.bankSlipUrl ?? null } };
    } catch (e) {
      console.error("Falha ao obter linha digitável:", (e as Error).message);
      return { ...base, boleto: { url: cobranca.bankSlipUrl ?? null } };
    }
  }
  return base;
}

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const { user } = await requireUser(req);
    const admin = createAdminClient();

    const url = new URL(req.url);
    const body: Corpo = await req.json().catch(() => ({}));
    const action = url.searchParams.get("action") || body.action;

    // =====================================================================
    // CONSULTA DE SITUAÇÃO (polling da tela de PIX / boleto)
    // =====================================================================
    if (action === "status") {
      const orderId = url.searchParams.get("order_id") || body.order_id;
      if (orderId) {
        const { data: pedido } = await admin
          .from("orders")
          .select("id, status, provider_payment_id")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!pedido) return jsonResponse({ error: "Pedido não encontrado." }, 404);

        // Se o webhook ainda não chegou, pergunta direto ao Asaas.
        if (pedido.status !== "paid" && pedido.provider_payment_id) {
          const cobranca = await asaas<CobrancaAsaas>(`/payments/${pedido.provider_payment_id}`);
          if (STATUS_PAGO.includes(cobranca.status)) {
            await admin
              .from("orders")
              .update({ status: "paid", updated_at: new Date().toISOString() })
              .eq("id", pedido.id)
              .neq("status", "paid");
            return jsonResponse({ status: "paid" });
          }
          return jsonResponse({ status: "pending", asaas_status: cobranca.status });
        }
        return jsonResponse({ status: pedido.status === "paid" ? "paid" : "pending" });
      }

      // Sem order_id: consulta a assinatura do usuário.
      const { data: sub } = await admin
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .maybeSingle();
      return jsonResponse({
        status: sub && ["active", "trialing"].includes(sub.status) ? "paid" : "pending",
      });
    }

    // =====================================================================
    // CANCELAMENTO — acesso mantido até o fim do período pago
    // =====================================================================
    if (action === "cancel") {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("id, provider_subscription_id, status, current_period_end")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (!sub) return jsonResponse({ error: "Nenhuma assinatura ativa encontrada." }, 404);

      // Remover a assinatura no Asaas interrompe as cobranças futuras. O acesso
      // continua porque `has_active_subscription` respeita current_period_end.
      if (sub.provider_subscription_id) {
        try {
          await asaas(`/subscriptions/${sub.provider_subscription_id}`, { method: "DELETE" });
        } catch (e) {
          console.error("Falha ao remover assinatura no Asaas:", (e as Error).message);
        }
      }

      await admin
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Sem período conhecido, encerra na hora para não liberar acesso indevido.
          ...(sub.current_period_end ? {} : { status: "canceled" }),
        })
        .eq("id", sub.id);

      return jsonResponse({
        canceled: true,
        at_period_end: !!sub.current_period_end,
        access_until: sub.current_period_end,
      });
    }

    // =====================================================================
    // CRIAÇÃO DE COBRANÇA
    // =====================================================================
    const tipo = body.type as string;
    const metodo = body.method as MetodoInterno;

    if (!["pix", "boleto", "credit_card"].includes(metodo)) {
      return jsonResponse(
        { error: "Campo 'method' inválido. Use 'pix', 'boleto' ou 'credit_card'." },
        400,
      );
    }
    const erroPagador = validarPagador(body.payer, metodo);
    if (erroPagador) return jsonResponse({ error: erroPagador }, 400);

    const billingType = METODO_PARA_BILLING[metodo];
    const clienteId = await garantirCliente(admin, user.id, user.email, body.payer);
    const dadosCartao = metodo === "credit_card" ? blocoCartao(body, user.email, req) : {};

    // ---------------------------------------------------------------
    // ASSINATURA
    // ---------------------------------------------------------------
    if (tipo === "subscription") {
      if (!body.plan_slug) {
        return jsonResponse({ error: "Campo 'plan_slug' é obrigatório." }, 400);
      }

      const { data: plano } = await admin
        .from("plans")
        .select("id, name, slug, price_cents, interval")
        .eq("slug", body.plan_slug)
        .eq("active", true)
        .maybeSingle();

      if (!plano) return jsonResponse({ error: "Plano não encontrado." }, 404);
      if (!plano.price_cents || plano.price_cents <= 0) {
        return jsonResponse(
          { error: "Este plano é gratuito e não exige pagamento." },
          400,
        );
      }
      if (plano.interval !== "month" && plano.interval !== "year") {
        return jsonResponse(
          { error: "Plano sem ciclo de cobrança recorrente (use 'month' ou 'year')." },
          400,
        );
      }

      const assinatura = await asaas<{ id: string; status: string; nextDueDate: string }>(
        "/subscriptions",
        {
          method: "POST",
          body: JSON.stringify({
            customer: clienteId,
            billingType,
            value: plano.price_cents / 100,
            nextDueDate: vencimento(metodo === "boleto" ? DIAS_BOLETO : 0),
            cycle: plano.interval === "year" ? "YEARLY" : "MONTHLY",
            description: `${plano.name} — IRTS Academy`,
            externalReference: `${user.id}:${plano.id}`,
            ...dadosCartao,
          }),
        },
      );

      // Primeira cobrança gerada pela assinatura (é dela que sai o QR Code).
      const cobrancas = await asaas<{ data: CobrancaAsaas[] }>(
        `/subscriptions/${assinatura.id}/payments`,
      );
      const primeira = cobrancas.data?.[0];
      const jaPago = primeira ? STATUS_PAGO.includes(primeira.status) : false;

      // Só vira 'active' quando o dinheiro entra — 'incomplete' não dá acesso.
      const linha = {
        user_id: user.id,
        plan_id: plano.id,
        status: jaPago ? "active" : "incomplete",
        provider: "asaas",
        provider_subscription_id: assinatura.id,
        provider_customer_id: clienteId,
        current_period_end: jaPago && assinatura.nextDueDate
          ? new Date(`${assinatura.nextDueDate}T23:59:59Z`).toISOString()
          : null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      };

      const { data: existente } = await admin
        .from("subscriptions")
        .select("id")
        .eq("provider_subscription_id", assinatura.id)
        .maybeSingle();

      if (existente) {
        await admin.from("subscriptions").update(linha).eq("id", existente.id);
      } else {
        await admin.from("subscriptions").insert(linha);
      }

      if (!primeira) {
        return jsonResponse(
          { error: "Assinatura criada, mas a primeira cobrança não foi gerada. Fale com o suporte." },
          502,
        );
      }

      return jsonResponse({
        subscription_id: assinatura.id,
        plan: { name: plano.name, slug: plano.slug, interval: plano.interval },
        ...(await detalhesDoPagamento(primeira, metodo)),
      });
    }

    // ---------------------------------------------------------------
    // COMPRA AVULSA (curso ou livro)
    // ---------------------------------------------------------------
    if (tipo === "course" || tipo === "book") {
      const quantidade = Math.max(1, parseInt(body.quantity, 10) || 1);
      const tabela = tipo === "course" ? "courses" : "books";
      const produtoId = tipo === "course" ? body.course_id : body.book_id;

      if (!produtoId) {
        return jsonResponse(
          { error: `Campo '${tipo === "course" ? "course_id" : "book_id"}' é obrigatório.` },
          400,
        );
      }

      const { data: produto } = await admin
        .from(tabela)
        .select("id, title, price_cents")
        .eq("id", produtoId)
        .maybeSingle();
      if (!produto) return jsonResponse({ error: "Produto não encontrado." }, 404);

      const unitario = produto.price_cents ?? 0;
      if (unitario <= 0) {
        return jsonResponse({ error: "Produto sem preço definido." }, 400);
      }
      const total = unitario * quantidade;

      // 1. Pedido pendente (o trigger on_order_paid matricula quando virar 'paid')
      const { data: pedido, error: erroPedido } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total_cents: total,
          currency: "BRL",
          provider: "asaas",
          payment_method: metodo,
          shipping_address: tipo === "book" ? body.shipping_address ?? null : null,
          metadata: { type: tipo, product_id: produtoId },
        })
        .select("id")
        .single();
      if (erroPedido) {
        return jsonResponse(
          { error: "Falha ao criar pedido.", detail: erroPedido.message },
          500,
        );
      }

      const { error: erroItem } = await admin.from("order_items").insert({
        order_id: pedido.id,
        product_type: tipo,
        product_id: produtoId,
        title: produto.title,
        quantity: quantidade,
        unit_price_cents: unitario,
      });
      if (erroItem) {
        return jsonResponse(
          { error: "Falha ao criar item do pedido.", detail: erroItem.message },
          500,
        );
      }

      // 2. Cobrança no Asaas
      let cobranca: CobrancaAsaas;
      try {
        cobranca = await asaas<CobrancaAsaas>("/payments", {
          method: "POST",
          body: JSON.stringify({
            customer: clienteId,
            billingType,
            value: total / 100,
            dueDate: vencimento(metodo === "boleto" ? DIAS_BOLETO : 0),
            description: `${produto.title}${quantidade > 1 ? ` (${quantidade}x)` : ""} — IRTS Academy`,
            externalReference: pedido.id,
            ...dadosCartao,
          }),
        });
      } catch (e) {
        // Cartão recusado / dados inválidos: cancela o pedido para não ficar órfão.
        await admin
          .from("orders")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", pedido.id);
        throw e;
      }

      const pago = STATUS_PAGO.includes(cobranca.status);
      const detalhes = await detalhesDoPagamento(cobranca, metodo);

      // 3. Grava o id da cobrança (e libera o acesso se já foi aprovada)
      await admin
        .from("orders")
        .update({
          provider_payment_id: cobranca.id,
          status: pago ? "paid" : "pending",
          metadata: { type: tipo, product_id: produtoId, asaas: detalhes },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedido.id);

      return jsonResponse({ order_id: pedido.id, ...detalhes });
    }

    return jsonResponse(
      { error: "Campo 'type' inválido. Use 'subscription', 'course' ou 'book'." },
      400,
    );
  } catch (e) {
    if (e instanceof AuthError) return jsonResponse({ error: e.message }, 401);
    if (e instanceof AsaasNaoConfigurado) return jsonResponse({ error: e.message }, 503);
    if (e instanceof AsaasError) {
      console.error("Asaas recusou:", e.message, e.detalhes);
      return jsonResponse({ error: e.message }, e.status);
    }
    console.error("checkout erro:", e);
    return jsonResponse(
      { error: "Erro interno.", detail: String((e as Error)?.message ?? e) },
      500,
    );
  }
});
