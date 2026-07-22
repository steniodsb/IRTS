import Link from 'next/link';
import { BookOpen, Lock, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState, LinkButton } from '@/components/ui';
import { LIBRARY_TYPE_LABELS, type LibraryType } from '@irts/shared';
import { DownloadButton } from '@/components/DownloadButton';

export const metadata = { title: 'Biblioteca' };

const TYPES = Object.keys(LIBRARY_TYPE_LABELS) as LibraryType[];

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const tipo = TYPES.includes(searchParams.tipo as LibraryType) ? (searchParams.tipo as LibraryType) : null;

  let query = supabase
    .from('library_items')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (tipo) query = query.eq('type', tipo);

  const [{ data: items }, { data: subs }] = await Promise.all([
    query,
    supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user!.id)
      .in('status', ['active', 'trialing']),
  ]);

  const hasActiveSub = (subs ?? []).length > 0;

  const chipCls = (active: boolean) =>
    `chip transition ${active ? 'border-gold/60 text-gold' : 'hover:border-gold/40 hover:text-cream'}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-cream">
          <BookOpen size={26} className="text-gold" /> Biblioteca
        </h1>
        <p className="mt-1 text-cream/50">Modelos, e-books, checklists e materiais jurídicos para download.</p>
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-2">
        <Link href="/app/biblioteca" className={chipCls(!tipo)}>Todos</Link>
        {TYPES.map((t) => (
          <Link key={t} href={`/app/biblioteca?tipo=${t}`} className={chipCls(tipo === t)}>
            {LIBRARY_TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      {items && items.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => {
            const locked = !item.is_free && !hasActiveSub;
            return (
              <Card key={item.id} className="flex h-full flex-col">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Badge tone="gold">{LIBRARY_TYPE_LABELS[item.type as LibraryType] ?? item.type}</Badge>
                  {item.is_free && <Badge tone="success">Gratuito</Badge>}
                </div>
                <div className="mb-2 flex items-start gap-2">
                  <FileText size={18} className="mt-0.5 shrink-0 text-cream/40" />
                  <p className="font-medium text-cream">{item.title}</p>
                </div>
                {item.description && <p className="text-sm text-cream/55">{item.description}</p>}
                {item.category && <p className="mt-2 text-xs text-cream/40">{item.category}</p>}

                <div className="mt-4 flex-1" />

                {locked ? (
                  <LinkButton href="/planos" variant="outline" className="w-full">
                    <Lock size={15} /> Assine para baixar
                  </LinkButton>
                ) : (
                  <DownloadButton
                    libraryItemId={item.id}
                    fileUrl={item.file_url}
                    userId={user!.id}
                  />
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum material encontrado"
          description={tipo ? 'Nenhum item deste tipo por enquanto. Tente outro filtro.' : 'Os materiais aparecerão aqui em breve.'}
        />
      )}
    </div>
  );
}
