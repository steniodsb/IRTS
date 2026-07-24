import { Fragment } from 'react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { ToolForm } from '@/components/admin/ToolForm';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Ferramentas' };

const KIND_LABELS: Record<string, string> = {
  calculadora: 'Calculadora', simulador: 'Simulador', matriz: 'Matriz',
  cronograma: 'Cronograma', planilha: 'Planilha',
};

export default async function AdminFerramentasPage() {
  const supabase = createClient();
  const { data: tools } = await supabase.from('tools').select('*').order('sort_order');
  const list = (tools ?? []) as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Ferramentas</h1>
        <p className="mt-1 text-cream/50">
          Calculadoras e simuladores da área de membros. As nativas já vêm cadastradas;
          aqui você pode publicar, reordenar ou adicionar planilhas e links externos.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <ToolForm />

        <div>
          {list.length > 0 ? (
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-line/60 text-left text-cream/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">Ferramenta</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Destino</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {list.map((t) => (
                    <Fragment key={t.id}>
                      <tr className="text-cream/80">
                        <td className="px-5 py-3">
                          <p className="font-medium text-cream">{t.name}</p>
                          {t.description && <p className="line-clamp-1 text-xs text-cream/40">{t.description}</p>}
                        </td>
                        <td className="px-5 py-3">{KIND_LABELS[t.kind] ?? t.kind}</td>
                        <td className="px-5 py-3 text-xs text-cream/50">{t.route || t.url || '—'}</td>
                        <td className="px-5 py-3">
                          {t.published ? <Badge tone="success">Publicada</Badge> : <Badge>Rascunho</Badge>}
                        </td>
                        <td className="px-5 py-3">
                          <RowActions table="tools" id={t.id} published={t.published} label="a ferramenta" />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-5 pb-4 pt-0">
                          <details>
                            <summary className="cursor-pointer text-sm text-gold hover:underline">Editar ferramenta</summary>
                            <div className="mt-4"><ToolForm tool={t} /></div>
                          </details>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <EmptyState
              title="Nenhuma ferramenta cadastrada"
              description="Rode a migração 20260723000200 para carregar as 5 ferramentas nativas, ou cadastre uma aqui."
            />
          )}
        </div>
      </div>
    </div>
  );
}
