import { Fragment } from 'react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { LibraryForm } from '@/components/admin/LibraryForm';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';
import { LIBRARY_TYPE_LABELS, formatDate } from '@irts/shared';

export const metadata = { title: 'Biblioteca' };

export default async function AdminBibliotecaPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from('library_items').select('*').order('created_at', { ascending: false });

  const list = (items ?? []) as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Biblioteca</h1>
        <p className="mt-1 text-cream/50">E-books, modelos, ACTs, CCTs e jurisprudência.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <LibraryForm />

        <div>
          {list.length > 0 ? (
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="border-b border-line/60 text-left text-cream/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">Título</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Criado</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {list.map((it) => (
                    <Fragment key={it.id}>
                      <tr className="text-cream/80">
                        <td className="px-5 py-3">
                          <p className="font-medium text-cream">{it.title}</p>
                          {it.category && <p className="text-xs text-cream/40">{it.category}</p>}
                        </td>
                        <td className="px-5 py-3">{LIBRARY_TYPE_LABELS[it.type as keyof typeof LIBRARY_TYPE_LABELS] ?? it.type}</td>
                        <td className="px-5 py-3">
                          {it.published ? <Badge tone="success">Publicado</Badge> : <Badge>Rascunho</Badge>}
                          {it.is_free && <span className="ml-1 text-xs text-gold">grátis</span>}
                        </td>
                        <td className="px-5 py-3 text-cream/50">{formatDate(it.created_at)}</td>
                        <td className="px-5 py-3">
                          <RowActions table="library_items" id={it.id} published={it.published} label="o item" />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-5 pb-4 pt-0">
                          <details>
                            <summary className="cursor-pointer text-sm text-gold hover:underline">Editar item</summary>
                            <div className="mt-4">
                              <LibraryForm item={{
                                id: it.id, title: it.title, type: it.type, description: it.description,
                                category: it.category, file_url: it.file_url, storage_path: it.storage_path,
                                is_free: it.is_free, published: it.published,
                              }} />
                            </div>
                          </details>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <EmptyState title="Biblioteca vazia" description="Adicione o primeiro item usando o formulário ao lado." />
          )}
        </div>
      </div>
    </div>
  );
}
