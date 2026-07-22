import { Check } from 'lucide-react';
import { SectionTitle, Card, Badge, EmptyState, LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export const metadata = { title: 'Planos' };

export default async function PlanosPage() {
  const supabase = createClient();
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  const list = plans ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionTitle
        center
        overline="Assinatura"
        title="Escolha seu plano"
        subtitle="Comece grátis e evolua para o acesso completo quando quiser. Sem fidelidade — cancele a qualquer momento."
      />

      {list.length > 0 ? (
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {list.map((p: any) => (
            <Card key={p.id} className={p.highlight ? 'relative border-gold shadow-gold' : 'relative'}>
              {p.highlight && <div className="mb-3"><Badge tone="gold">Mais popular</Badge></div>}
              <h3 className="font-serif text-2xl text-cream">{p.name}</h3>
              {p.description && <p className="mt-1 text-sm text-cream/50">{p.description}</p>}
              <p className="mt-4 text-3xl font-semibold text-gold">
                {p.price_cents === 0 ? 'Grátis' : formatBRL(p.price_cents)}
                <span className="text-sm text-cream/40">
                  {p.interval === 'month' ? '/mês' : p.interval === 'year' ? '/ano' : ''}
                </span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-cream/60">
                {((p.features as string[]) ?? []).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-gold" /> {f}
                  </li>
                ))}
              </ul>
              <LinkButton href="/cadastro" variant={p.highlight ? 'gold' : 'outline'} className="mt-7 w-full">
                {p.price_cents === 0 ? 'Criar conta' : 'Assinar'}
              </LinkButton>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState title="Nenhum plano ativo" description="Os planos de assinatura serão publicados em breve." />
        </div>
      )}

      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-cream/40">
        Os valores podem incluir tributos. A cobrança e o cancelamento são geridos com segurança pelo provedor de pagamentos.
      </p>
    </section>
  );
}
