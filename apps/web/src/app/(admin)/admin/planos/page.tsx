import { Card, Badge, EmptyState } from '@/components/ui';
import { PlanForm } from '@/components/admin/PlanForm';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export const metadata = { title: 'Planos' };

const INTERVAL_SUFFIX: Record<string, string> = {
  month: '/mês',
  year: '/ano',
  free: '',
  one_time: '',
};

export default async function AdminPlanosPage() {
  const supabase = createClient();
  const { data: plans } = await supabase
    .from('plans').select('*').order('sort_order');

  const list = (plans ?? []) as any[];

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
            list.map((p) => (
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
            ))
          ) : (
            <EmptyState title="Nenhum plano ainda" description="Crie o primeiro plano usando o formulário ao lado." />
          )}
        </div>
      </div>
    </div>
  );
}
