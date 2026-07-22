import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { SectionTitle, Card, Badge, EmptyState } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export const metadata = { title: 'Cursos' };

export default async function CursosPage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('sort_order');

  const list = courses ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionTitle center overline="Aprenda" title="Cursos" subtitle="Trilhas aplicadas em relações trabalhistas e sindicais, com progresso e certificado." />

      {list.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c: any) => (
            <Link key={c.id} href={`/cursos/${c.slug}`}>
              <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:border-gold/50">
                <div className="relative aspect-video bg-surface-alt">
                  {c.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-cream/20">
                      <PlayCircle size={40} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {c.category && <Badge tone="gold">{c.category}</Badge>}
                  <h3 className="mt-3 font-serif text-xl text-cream">{c.title}</h3>
                  {c.subtitle && <p className="mt-1 line-clamp-2 text-sm text-cream/55">{c.subtitle}</p>}
                  <p className="mt-4 text-sm font-semibold text-gold">
                    {c.is_free ? 'Gratuito' : c.price_cents ? formatBRL(c.price_cents) : 'Incluso no plano'}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState title="Nenhum curso publicado ainda" description="Novos cursos serão disponibilizados em breve." />
        </div>
      )}
    </section>
  );
}
