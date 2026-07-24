import { Fragment } from 'react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { AlertForm } from '@/components/admin/AlertForm';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@irts/shared';
import { categoryLabel, severityLabel, severityTone } from '@/lib/alerts';

export const metadata = { title: 'Alertas' };

export default async function AdminAlertasPage() {
  const supabase = createClient();
  const { data: alerts } = await supabase
    .from('alerts').select('*').order('published_at', { ascending: false });

  const list = (alerts ?? []) as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Alertas Inteligentes</h1>
        <p className="mt-1 text-cream/50">Convenções coletivas, decisões judiciais, legislação e prazos.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <AlertForm />

        <div>
          {list.length > 0 ? (
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-line/60 text-left text-cream/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">Título</th>
                    <th className="px-5 py-3 font-medium">Categoria</th>
                    <th className="px-5 py-3 font-medium">Severidade</th>
                    <th className="px-5 py-3 font-medium">Publicado em</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {list.map((a) => (
                    <Fragment key={a.id}>
                      <tr className="text-cream/80">
                        <td className="px-5 py-3">
                          <p className="font-medium text-cream">{a.title}</p>
                          {a.source && <p className="text-xs text-cream/40">{a.source}</p>}
                        </td>
                        <td className="px-5 py-3">{categoryLabel(a.category) ?? '—'}</td>
                        <td className="px-5 py-3">
                          <Badge tone={severityTone(a.severity)}>{severityLabel(a.severity)}</Badge>
                        </td>
                        <td className="px-5 py-3 text-cream/60">{formatDate(a.published_at)}</td>
                        <td className="px-5 py-3">
                          <RowActions table="alerts" id={a.id} published={a.published} label="o alerta" />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-5 pb-4 pt-0">
                          <details>
                            <summary className="cursor-pointer text-sm text-gold hover:underline">Editar alerta</summary>
                            <div className="mt-4">
                              <AlertForm alert={{
                                id: a.id, title: a.title, body: a.body, category: a.category,
                                severity: a.severity, url: a.url, source: a.source, published: a.published,
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
            <EmptyState title="Nenhum alerta" description="Publique o primeiro alerta usando o formulário ao lado." />
          )}
        </div>
      </div>
    </div>
  );
}
