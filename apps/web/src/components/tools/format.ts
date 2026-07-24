/**
 * Utilidades numéricas compartilhadas pelas ferramentas (calculadoras/simuladores).
 * Todos os valores monetários circulam em REAIS (float) e são formatados
 * com `formatBRL` de @irts/shared (que recebe CENTAVOS).
 */
import { formatBRL } from '@irts/shared';

/** Converte o texto de um input em número. Vazio/inválido → fallback (0). */
export function toNum(raw: string | number | null | undefined, fallback = 0): number {
  if (raw === null || raw === undefined || raw === '') return fallback;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

/** Formata reais (float) como moeda pt-BR. Protege contra NaN/Infinity. */
export function brl(reais: number): string {
  const v = Number.isFinite(reais) ? reais : 0;
  return formatBRL(Math.round(v * 100));
}

/** Formata número simples em pt-BR. */
export function numFmt(v: number, digits = 2): string {
  const n = Number.isFinite(v) ? v : 0;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Formata percentual (recebe o número já em %, ex.: 8.5 → "8,50%"). */
export function pctFmt(v: number, digits = 2): string {
  return `${numFmt(v, digits)}%`;
}

/** Divisão protegida contra zero / NaN. */
export function safeDiv(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  const r = a / b;
  return Number.isFinite(r) ? r : 0;
}

/** Data (yyyy-mm-dd de um <input type="date">) → Date local, ou null. */
export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Formata Date como dd/mm/aaaa. */
export function dateFmt(d: Date | null): string {
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Formata Date por extenso curto (ex.: "12 de mar. de 2026"). */
export function dateLongFmt(d: Date | null): string {
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Soma dias a uma data (sem mutar). */
export function addDays(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + days);
  return out;
}

/** Soma meses a uma data (sem mutar). */
export function addMonths(d: Date, months: number): Date {
  const out = new Date(d.getTime());
  out.setMonth(out.getMonth() + months);
  return out;
}

/** Diferença em dias inteiros entre duas datas (b − a). */
export function diffDays(a: Date, b: Date): number {
  const ms = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
    - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  return Math.round(ms / 86400000);
}

/** Rótulo humano de contagem de dias ("faltam 12 dias" / "há 3 dias" / "hoje"). */
export function daysLabel(days: number): string {
  if (days === 0) return 'hoje';
  if (days > 0) return days === 1 ? 'falta 1 dia' : `faltam ${days} dias`;
  const p = Math.abs(days);
  return p === 1 ? 'há 1 dia' : `há ${p} dias`;
}
