// ==========================================================================
// Cliente HTTP do Asaas + helpers compartilhados pelas Edge Functions.
//
// Autenticação: header `access_token` com a chave da conta.
// O ambiente (produção x sandbox) é deduzido do prefixo da chave e pode ser
// forçado por ASAAS_ENV=production|sandbox.
// ==========================================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_PRODUCAO = "https://api.asaas.com/v3";
const BASE_SANDBOX = "https://api-sandbox.asaas.com/v3";

/** Erro do Asaas já com a mensagem legível que a API devolve. */
export class AsaasError extends Error {
  status: number;
  detalhes: unknown;
  constructor(message: string, status = 502, detalhes: unknown = null) {
    super(message);
    this.status = status;
    this.detalhes = detalhes;
  }
}

/** Erro de configuração (chave ausente) — separado para responder 503. */
export class AsaasNaoConfigurado extends Error {}

export type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

/** Método como o usamos internamente (coluna orders.payment_method). */
export type MetodoInterno = "pix" | "boleto" | "credit_card";

export const METODO_PARA_BILLING: Record<MetodoInterno, BillingType> = {
  pix: "PIX",
  boleto: "BOLETO",
  credit_card: "CREDIT_CARD",
};

export function asaasConfig(): { key: string; base: string; producao: boolean } {
  const key = (Deno.env.get("ASAAS_API_KEY") ?? "").trim();
  if (!key) {
    throw new AsaasNaoConfigurado(
      "ASAAS_API_KEY não configurada. Defina o secret antes de processar " +
        "pagamentos (supabase secrets set ASAAS_API_KEY=...).",
    );
  }
  const forcado = (Deno.env.get("ASAAS_ENV") ?? "").trim().toLowerCase();
  const producao = forcado
    ? forcado === "production" || forcado === "producao"
    : /^\$?aact_prod_/.test(key);

  return { key, base: producao ? BASE_PRODUCAO : BASE_SANDBOX, producao };
}

/** Chamada à API do Asaas já com auth, JSON e tratamento de erro. */
export async function asaas<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { key, base } = asaasConfig();

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "IRTS-Academy",
      access_token: key,
      ...(init.headers ?? {}),
    },
  });

  const texto = await res.text();
  let corpo: any = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = texto;
  }

  if (!res.ok) {
    // Formato de erro do Asaas: { errors: [{ code, description }] }
    const descricao = Array.isArray(corpo?.errors) && corpo.errors.length
      ? corpo.errors.map((e: any) => e.description).join(" · ")
      : `Falha na comunicação com o Asaas (HTTP ${res.status}).`;
    throw new AsaasError(descricao, res.status === 401 ? 500 : 400, corpo);
  }

  return corpo as T;
}

// --------------------------------------------------------------------------
// Cliente (customer)
// --------------------------------------------------------------------------

export type DadosPagador = {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  addressNumber?: string;
  complement?: string;
};

/** Mantém só os dígitos (CPF/CNPJ, CEP e telefone vão sem máscara). */
export const soDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

/** Valida CPF (11) ou CNPJ (14) pelos dígitos verificadores. */
export function cpfCnpjValido(valor: string): boolean {
  const d = soDigitos(valor);
  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false;
    const calc = (ate: number) => {
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
  }
  if (d.length === 14) {
    if (/^(\d)\1{13}$/.test(d)) return false;
    const calc = (ate: number) => {
      const pesos = ate === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      let soma = 0;
      for (let i = 0; i < ate; i++) soma += Number(d[i]) * pesos[i];
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
  }
  return false;
}

/**
 * Devolve o id do cliente Asaas do usuário, criando-o na primeira vez.
 * O id fica gravado em profiles.asaas_customer_id.
 */
export async function garantirCliente(
  admin: SupabaseClient,
  userId: string,
  email: string | undefined,
  pagador: DadosPagador,
): Promise<string> {
  const { data: perfil } = await admin
    .from("profiles")
    .select("asaas_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (perfil?.asaas_customer_id) return perfil.asaas_customer_id;

  const criado = await asaas<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: pagador.name,
      cpfCnpj: soDigitos(pagador.cpfCnpj),
      email: pagador.email ?? email ?? undefined,
      mobilePhone: pagador.phone ? soDigitos(pagador.phone) : undefined,
      postalCode: pagador.postalCode ? soDigitos(pagador.postalCode) : undefined,
      addressNumber: pagador.addressNumber || undefined,
      complement: pagador.complement || undefined,
      externalReference: userId,
      notificationDisabled: false,
    }),
  });

  await admin
    .from("profiles")
    .update({ asaas_customer_id: criado.id, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return criado.id;
}

// --------------------------------------------------------------------------
// Cobrança
// --------------------------------------------------------------------------

export type CobrancaAsaas = {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  subscription?: string;
};

/** Status do Asaas que significam "dinheiro garantido". */
export const STATUS_PAGO = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];

/** Data de vencimento no formato exigido (YYYY-MM-DD). */
export function vencimento(diasAFrente = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  return d.toISOString().slice(0, 10);
}

/** QR Code do PIX de uma cobrança. */
export async function pixDaCobranca(paymentId: string) {
  const r = await asaas<{ encodedImage: string; payload: string; expirationDate: string }>(
    `/payments/${paymentId}/pixQrCode`,
  );
  return {
    imagemBase64: r.encodedImage,
    copiaECola: r.payload,
    expiraEm: r.expirationDate,
  };
}

/** Linha digitável do boleto de uma cobrança. */
export async function boletoDaCobranca(paymentId: string) {
  const r = await asaas<{ identificationField: string; barCode: string }>(
    `/payments/${paymentId}/identificationField`,
  );
  return { linhaDigitavel: r.identificationField, codigoDeBarras: r.barCode };
}

/** IP do comprador — o Asaas exige em transações de cartão (antifraude). */
export function ipDoCliente(req: Request): string | undefined {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? undefined;
}
