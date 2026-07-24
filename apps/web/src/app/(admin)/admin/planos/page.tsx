import { Users } from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { PlanForm } from '@/components/admin/PlanForm';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';
import { formatBRL, formatDate } from '@irts/shared';

export const metadata = { title: 'Planos' };

const INTERVAL_SUFFIX: Record<string, string> = {
  month: '/mês',
  year: '/ano',
  free: '',
  one_time: '',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  trialing: 'Em teste',
  past_due: 'Em atraso',
  canceled: 'Cancelado',
  incomplete: 'Incompleto',
};

const ACTIVE_STATUSES = ['active', 'trialing'];

export default async function AdminPlanosPage() {
  const supabase = createClient();
  const [{ data: plans }, { data: subscriptions }] = await Promise.all([
    supabase.from('plans').select('*').order('sort_order'),
    supabase
      .from('subscriptions')
      .select('id, plan_id, status, current_period_end, created_at, profiles(full_name)')
      .order('created_at', { ascending: false }),
  ]);

  const list = (plans ?? []) as any[];

  // Agrupa assinantes por plano.
  const subsByPlan = new Map<string, any[]>();
  for (const s of (subscriptions ?? []) as any[]) {
    if (!s.plan_id) continue;
    const arr = subsByPlan.get(s.plan_id);
    if (arr) arr.push(s);
    else subsByPlan.set(s.plan_id, [s]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Planos</h1>
        <p className="mt-1 text-cream/50">Planos de assinatura e acesso à plataforma.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <PlanForm />

        <div className="space-y-4">
          {list.length > 0 ? (
            list.map((p) => {
              const subs = subsByPlan.get(p.id) ?? [];
              const activeCount = subs.filter((s) => ACTIVE_STATUSES.includes(s.status)).length;
              return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-cream">{p.name}</p>
                      {p.highlight && <Badge tone="gold">Destaque</Badge>}
                      {p.active ? <Badge tone="success">Ativo</Badge> : <Badge>Inativo</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-cream/60">
                      {formatBRL(p.price_cents)}
                      <span className="text-cream/40">{INTERVAL_SUFFIX[p.interval] ?? ''}</span>
                    </p>
                  </div>
                  <RowActions table="plans" id={p.id} published={p.active} publishedColumn="active" label="o plano" />
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-sm text-cream/60">
                  <Users size={15} className="text-gold" />
                  {activeCount} {activeCount === 1 ? 'assinante ativo' : 'assinantes ativos'}
                  {subs.length > activeCount && (
                    <span className="text-cream/40">· {subs.length} no total</span>
                  )}
                </p>

                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gold hover:underline">Ver assinantes</summary>
                  {subs.length > 0 ? (
                    <ul className="mt-3 divide-y divide-line/60 rounded-xl border border-line/60">
                      {subs.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                          <span className="text-sm text-cream">{s.profiles?.full_name ?? 'Sem nome'}</span>
                          <span className="flex items-center gap-2">
                            {s.current_period_end && (
                              <span className="text-xs text-cream/40">
                                Renova em {formatDate(s.current_period_end)}
                              </span>
                            )}
                            <Badge tone={ACTIVE_STATUSES.includes(s.status) ? 'success' : s.status === 'past_due' ? 'warning' : 'default'}>
                              {STATUS_LABEL[s.status] ?? s.status}
                            </Badge>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-cream/40">Nenhum assinante ainda.</p>
                  )}
                </details>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gold hover:underline">Editar plano</summary>
                  <div className="mt-4">
                    <PlanForm plan={{
                      id: p.id, name: p.name, slug: p.slug, description: p.description,
                      price_cents: p.price_cents, interval: p.interval, stripe_price_id: p.stripe_price_id,
                      features: Array.isArray(p.features) ? p.features : [],
                      highlight: p.highlight, active: p.active,
                    }} />
                  </div>
                </details>
              </Card>
              );
            })
          ) : (
            <EmptyState title="Nenhum plano ainda" description="Crie o primeiro plano usando o formulário ao lado." />
          )}
        </div>
      </div>
    </div>
  );
}
