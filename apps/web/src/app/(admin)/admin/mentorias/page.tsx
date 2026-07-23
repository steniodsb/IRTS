import { Card, Badge, EmptyState } from '@/components/ui';
import { MentorshipForm } from '@/components/admin/MentorshipForm';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export const metadata = { title: 'Mentorias' };

export default async function AdminMentoriasPage() {
  const supabase = createClient();
  const { data: mentorships } = await supabase
    .from('mentorships').select('*').order('created_at', { ascending: false });

  const list = (mentorships ?? []) as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Mentorias</h1>
        <p className="mt-1 text-cream/50">Mentorias individuais e em grupo oferecidas ao público.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <MentorshipForm />

        <div>
          {list.length > 0 ? (
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-line/60 text-left text-cream/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">Título</th>
                    <th className="px-5 py-3 font-medium">Formato</th>
                    <th className="px-5 py-3 font-medium">Preço</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {list.map((m) => (
                    <tr key={m.id} className="text-cream/80">
                      <td className="px-5 py-3">
                        <p className="font-medium text-cream">{m.title}</p>
                        <p className="text-xs text-cream/40">/{m.slug}</p>
                      </td>
                      <td className="px-5 py-3">{m.format ?? '—'}</td>
                      <td className="px-5 py-3">{formatBRL(m.price_cents)}</td>
                      <td className="px-5 py-3">
                        {m.published ? <Badge tone="success">Publicado</Badge> : <Badge>Rascunho</Badge>}
                      </td>
                      <td className="px-5 py-3">
                        <RowActions table="mentorships" id={m.id} published={m.published} label="a mentoria" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <EmptyState title="Nenhuma mentoria ainda" description="Adicione a primeira mentoria usando o formulário ao lado." />
          )}
        </div>
      </div>
    </div>
  );
}
