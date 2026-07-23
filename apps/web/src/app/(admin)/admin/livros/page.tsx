import { Fragment } from 'react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { BookForm } from '@/components/admin/BookForm';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export const metadata = { title: 'Livros' };

export default async function AdminLivrosPage() {
  const supabase = createClient();
  const { data: books } = await supabase
    .from('books').select('*').order('created_at', { ascending: false });

  const list = (books ?? []) as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Livros</h1>
        <p className="mt-1 text-cream/50">Livros físicos enviados pelos Correios.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <BookForm />

        <div>
          {list.length > 0 ? (
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-line/60 text-left text-cream/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">Título / Autor</th>
                    <th className="px-5 py-3 font-medium">Preço</th>
                    <th className="px-5 py-3 font-medium">Estoque</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {list.map((b) => (
                    <Fragment key={b.id}>
                      <tr className="text-cream/80">
                        <td className="px-5 py-3">
                          <p className="font-medium text-cream">{b.title}</p>
                          {b.author && <p className="text-xs text-cream/40">{b.author}</p>}
                        </td>
                        <td className="px-5 py-3">{formatBRL(b.price_cents)}</td>
                        <td className="px-5 py-3">{b.stock}</td>
                        <td className="px-5 py-3">
                          {b.published ? <Badge tone="success">Publicado</Badge> : <Badge>Rascunho</Badge>}
                        </td>
                        <td className="px-5 py-3">
                          <RowActions table="books" id={b.id} published={b.published} label="o livro" />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-5 pb-4 pt-0">
                          <details>
                            <summary className="cursor-pointer text-sm text-gold hover:underline">Editar livro</summary>
                            <div className="mt-4">
                              <BookForm book={{
                                id: b.id, title: b.title, slug: b.slug, author: b.author, description: b.description,
                                cover_url: b.cover_url, price_cents: b.price_cents, stock: b.stock,
                                weight_grams: b.weight_grams, pages: b.pages, published: b.published,
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
            <EmptyState title="Nenhum livro ainda" description="Adicione o primeiro livro usando o formulário ao lado." />
          )}
        </div>
      </div>
    </div>
  );
}
