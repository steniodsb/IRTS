// ==========================================================================
// Clientes Supabase para Edge Functions
// - createAdminClient(): service-role (ignora RLS). Uso restrito ao servidor.
// - createUserClient(req): escopo do usuário autenticado (respeita RLS / auth).
// ==========================================================================

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Cliente com a service-role key. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são
 * injetadas automaticamente no runtime das Edge Functions do Supabase.
 */
export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes no ambiente da função.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Cliente no escopo do usuário: repassa o header Authorization recebido para
 * que auth.getUser() resolva o JWT. Usado só para identificar o usuário.
 */
export function createUserClient(req: Request): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(url!, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Extrai e valida o usuário autenticado a partir do Bearer token da requisição.
 * Retorna { user, token } ou lança se não houver usuário.
 */
export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new AuthError("Cabeçalho Authorization ausente.");
  }
  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    throw new AuthError("Token inválido ou usuário não encontrado.");
  }
  return { user: data.user, token };
}

export class AuthError extends Error {}
