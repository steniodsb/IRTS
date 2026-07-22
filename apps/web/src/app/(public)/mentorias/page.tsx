import { Users } from 'lucide-react';
import { SectionTitle, Card, Badge, EmptyState, LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export const metadata = { title: 'Mentorias' };

export default async function MentoriasPage() {
  const supabase = createClient();
  const { data: mentorships } = await supabase
    .from('mentorships')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  const list = mentorships ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionTitle center overline="Acompanhamento" title="Mentorias" subtitle="Orientação próxima e aplicada para acelerar sua atuação em relações trabalhistas e sindicais." />

      {list.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m: any) => (
            <Card key={m.id} className="flex h-full flex-col">
              <Users className="text-gold" size={26} />
              <h3 className="mt-4 font-serif text-xl text-cream">{m.title}</h3>
              {m.format && <div className="mt-2"><Badge tone="gold">{m.format}</Badge></div>}
              {m.description && <p className="mt-3 flex-1 text-sm text-cream/55">{m.description}</p>}
              <p className="mt-4 text-sm font-semibold text-gold">
                {m.price_cents ? formatBRL(m.price_cents) : 'Sob consulta'}
              </p>
              <LinkButton href="/contato" variant="outline" className="mt-4 w-full">Tenho interesse</LinkButton>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="Nenhuma mentoria disponível no momento"
            description="Entre em contato para saber sobre próximas turmas e formatos."
            action={<LinkButton href="/contato" variant="gold">Falar com o IRTS</LinkButton>}
          />
        </div>
      )}
    </section>
  );
}
