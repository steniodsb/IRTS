import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Regra de acesso de MEMBRO (Hub, Biblioteca, Ferramentas, IA, Alertas):
 *   assinatura ativa  OU  compra de curso nos últimos 6 meses  OU  admin.
 *
 * Usa a função `has_member_access` do banco. Se a migration ainda não foi
 * aplicada, cai num fallback equivalente feito em queries — assim a página
 * nunca quebra.
 */
export async function getMemberAccess(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;

  // Caminho preferencial: função no banco
  const { data, error } = await supabase.rpc('has_member_access', { uid: userId });
  if (!error && typeof data === 'boolean') return data;

  // Fallback (migration não aplicada): admin | assinatura ativa | compra < 6 meses
  const [{ data: profile }, { data: sub }, { data: enroll }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .limit(1),
    supabase
      .from('enrollments')
      .select('created_at')
      .eq('user_id', userId)
      .eq('source', 'purchase')
      .gte('created_at', new Date(Date.now() - 182 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1),
  ]);

  if (profile && ['admin', 'owner'].includes((profile as any).role)) return true;
  if (sub && sub.length > 0) return true;
  if (enroll && enroll.length > 0) return true;
  return false;
}
