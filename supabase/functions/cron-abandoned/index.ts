// ==========================================================================
// cron-abandoned — job agendado (pg_cron / cron externo)
// verify_jwt = false
//
// - Chama RPC flag_abandoned_courses(14): marca cursos abandonados e cria
//   notificações para o dono.
// - Opcional: envia digest por e-mail ao dono (Resend) com as notificações
//   do dono criadas nas últimas 24h.
//
// Proteção simples: se CRON_SECRET estiver definido, exige header
// 'x-cron-secret' correspondente (verify_jwt=false deixa a função pública).
//
// Retorna { flagged: n, emailed: bool }.
// ==========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";

const RESEND_URL = "https://api.resend.com/emails";
const IDLE_DAYS = 14;

async function sendOwnerDigest(
  notifications: Array<{ type: string; title: string; body: string | null; created_at: string }>,
): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  const to = Deno.env.get("OWNER_NOTIFY_EMAIL");
  if (!apiKey || !from || !to) {
    console.log("Resend não configurado (RESEND_API_KEY/EMAIL_FROM/OWNER_NOTIFY_EMAIL); pulando e-mail.");
    return false;
  }
  if (!notifications.length) return false;

  const items = notifications
    .map(
      (n) =>
        `<li><strong>${n.title}</strong>${n.body ? ` — ${n.body}` : ""}</li>`,
    )
    .join("");
  const html = `
    <h2>Resumo diário — IRTS / NDA Academy</h2>
    <p>Novas notificações do dono nas últimas 24h:</p>
    <ul>${items}</ul>
  `;

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Resumo diário — ${notifications.length} nova(s) notificação(ões)`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Falha ao enviar e-mail via Resend:", res.status, await res.text());
    return false;
  }
  return true;
}

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  // Proteção opcional por segredo (verify_jwt=false torna a função pública).
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  try {
    const admin = createAdminClient();

    // 1. Marca cursos abandonados
    const { data: flagged, error: rpcErr } = await admin.rpc(
      "flag_abandoned_courses",
      { idle_days: IDLE_DAYS },
    );
    if (rpcErr) {
      return jsonResponse(
        { error: "Falha ao marcar cursos abandonados.", detail: rpcErr.message },
        500,
      );
    }

    // 2. Digest por e-mail (últimas 24h de notificações do dono)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("notifications")
      .select("type, title, body, created_at")
      .eq("audience", "owner")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const emailed = await sendOwnerDigest(recent ?? []);

    return jsonResponse({ flagged: flagged ?? 0, emailed });
  } catch (e) {
    console.error("cron-abandoned erro:", e);
    return jsonResponse(
      { error: "Erro interno.", detail: String((e as Error)?.message ?? e) },
      500,
    );
  }
});
