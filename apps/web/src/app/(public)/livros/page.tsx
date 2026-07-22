import { BookOpen, Truck } from 'lucide-react';
import { SectionTitle, Card, EmptyState, LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export const metadata = { title: 'Livros' };

export default async function LivrosPage() {
  const supabase = createClient();
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  const list = books ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionTitle center overline="Biblioteca física" title="Livros" subtitle="Obras técnicas em relações trabalhistas e sindicais, entregues na sua casa." />

      <p className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2 text-center text-sm text-cream/50">
        <Truck size={16} className="text-gold" /> Livros físicos enviados pelos Correios. O frete é calculado no checkout conforme o CEP.
      </p>

      {list.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((b: any) => (
            <Card key={b.id} className="flex h-full flex-col overflow-hidden p-0">
              <div className="relative aspect-[3/4] bg-surface-alt">
                {b.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-cream/20"><BookOpen size={40} /></div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-lg text-cream">{b.title}</h3>
                {b.author && <p className="mt-1 text-sm text-cream/50">{b.author}</p>}
                {b.description && <p className="mt-2 line-clamp-3 flex-1 text-sm text-cream/45">{b.description}</p>}
                <p className="mt-4 text-sm font-semibold text-gold">
                  {b.price_cents ? formatBRL(b.price_cents) : 'Sob consulta'}
                </p>
                <p className="mt-1 text-xs text-cream/40">{b.stock > 0 ? 'Em estoque' : 'Indisponível'}</p>
                <LinkButton href="/cadastro" variant={b.stock > 0 ? 'gold' : 'outline'} className="mt-4 w-full">
                  {b.stock > 0 ? 'Comprar' : 'Avise-me'}
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState title="Nenhum livro publicado ainda" description="Novos títulos serão disponibilizados em breve." />
        </div>
      )}
    </section>
  );
}
