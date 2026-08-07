// ==========================================================================
// asaas-webhook — recebe as notificações de cobrança do Asaas
// verify_jwt = false  (o Asaas não envia JWT; validamos pelo token do header)
//
// Autenticação: o Asaas repete, em `asaas-access-token`, o "token de
// autenticação" cadastrado na tela de webhooks do painel. Comparamos com
// ASAAS_WEBHOOK_TOKEN.
//
// Eventos tratados:
//   PAYMENT_CONFIRMED / PAYMENT_RECEIVED
//       → pedido 'paid' (dispara o trigger on_order_paid: matrícula +
//         notificações) ou assinatura 'active' com o período estendido.
//   PAYMENT_OVERDUE                       → assinatura 'past_due'
//   PAYMENT_REFUNDED / CHARGEBACK         → pedido 'refunded'
//   PAYMENT_DELETED / capture recusada    → pedido 'canceled'
//
// Responde 200 mesmo em erro de processamento (com log), para o Asaas não
// reenviar em laço por falha nossa. Exceção: token inválido → 401.
// ==========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { asaas } from "../_shared/asaas.ts";

type Cobranca = {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  subscription?: string | null;
  externalReference?: string | null;
  customer?: string | null;
};

const PAGO = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_RECEIVED_IN_CASH"];
const DEVOLVIDO = [
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
];
const FALHOU = [
  "PAYMENT_DELETED",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
  "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
];

const agora = () => new Date().toISOString();

/** Atualiza o pedido ligado à cobrança, se existir. */
async function atualizarPedido(
  admin: SupabaseClient,
  cobranca: Cobranca,
  status: "paid" | "refunded" | "canceled",
): Promise<boolean> {
  // O id do pedido vai em externalReference; o provider_payment_id é o reserva.
  const filtro = admin.from("orders").select("id, status");
  const { data: pedido } = cobranca.externalReference
    ? await filtro.eq("id", cobranca.externalReference).maybeSingle()
    : await filtro.eq("provider_payment_id", cobranca.id).maybeSingle();

  if (!pedido) return false;
  if (pedido.status === status) return true; // já processado (reenvio)

  await admin
    .from("orders")
    .update({
      status,
      provider_payment_id: cobranca.id,
      updated_at: agora(),
    })
    .eq("id", pedido.id)
    .neq("status", status);

  return true;
}

/** Ativa/renova a assinatura ligada à cobrança. */
async function atualizarAssinatura(
  admin: SupabaseClient,
  cobranca: Cobranca,
  status: "active" | "past_due" | "canceled",
) {
  const asaasSubId = cobranca.subscription;
  if (!asaasSubId) return;

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, user_id")
    .eq("provider_subscription_id", asaasSubId)
    .maybeSingle();

  if (!sub) {
    console.warn(`Assinatura ${asaasSubId} não encontrada no banco; ignorando.`);
    return;
  }

  const patch: Record<string, unknown> = { status, updated_at: agora() };

  // Ao confirmar, o período vai até o próximo vencimento da assinatura.
  if (status === "active") {
    try {
      const detalhe = await asaas<{ nextDueDate?: string }>(`/subscriptions/${asaasSubId}`);
      if (detalhe.nextDueDate) {
        patch.current_period_end = new Date(`${detalhe.nextDueDate}T23:59:59Z`).toISOString();
      }
    } catch (e) {
      console.error("Falha ao ler a assinatura no Asaas:", (e as Error).message);
    }
  }

  await admin.from("subscriptions").update(patch).eq("id", sub.id);

  if (status === "canceled") {
    await admin.from("notifications").insert({
      audience: "owner",
      type: "subscription_canceled",
      title: "Assinatura cancelada",
      body: "Uma assinatura foi cancelada.",
      data: { subscription_id: asaasSubId, user_id: sub.user_id },
    });
  }
}

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const tokenEsperado = (Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "").trim();
  if (!tokenEsperado) {
    console.error("ASAAS_WEBHOOK_TOKEN não configurado.");
    return jsonResponse(
      {
        error:
          "ASAAS_WEBHOOK_TOKEN não configurado. Defina o secret com o mesmo " +
          "token cadastrado na tela de webhooks do Asaas.",
      },
      500,
    );
  }

  const tokenRecebido = (req.headers.get("asaas-access-token") ?? "").trim();
  if (tokenRecebido !== tokenEsperado) {
    console.error("Webhook do Asaas com token inválido.");
    return jsonResponse({ error: "Token inválido." }, 401);
  }

  let evento: { event?: string; payment?: Cobranca };
  try {
    evento = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo inválido." }, 400);
  }

  const tipo = evento.event ?? "";
  const cobranca = evento.payment;
  if (!cobranca?.id) {
    console.log(`Evento sem cobrança: ${tipo}`);
    return jsonResponse({ received: true });
  }

  const admin = createAdminClient();

  try {
    if (PAGO.includes(tipo)) {
      if (cobranca.subscription) {
        await atualizarAssinatura(admin, cobranca, "active");
      } else {
        const achou = await atualizarPedido(admin, cobranca, "paid");
        if (!achou) console.warn(`Cobrança ${cobranca.id} sem pedido correspondente.`);
      }
    } else if (tipo === "PAYMENT_OVERDUE") {
      if (cobranca.subscription) await atualizarAssinatura(admin, cobranca, "past_due");
    } else if (DEVOLVIDO.includes(tipo)) {
      await atualizarPedido(admin, cobranca, "refunded");
      if (cobranca.subscription) await atualizarAssinatura(admin, cobranca, "canceled");
    } else if (FALHOU.includes(tipo)) {
      await atualizarPedido(admin, cobranca, "canceled");
    } else {
      console.log(`Evento Asaas ignorado: ${tipo}`);
    }
  } catch (e) {
    console.error(`Erro ao processar ${tipo}:`, (e as Error).message);
  }

  return jsonResponse({ received: true });
});
