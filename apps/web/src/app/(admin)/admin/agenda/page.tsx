import { Card, Badge, EmptyState } from '@/components/ui';
import { EventForm } from '@/components/admin/EventForm';
import { createClient } from '@/lib/supabase/server';
import { EVENT_TYPE_LABELS, formatDateTime } from '@irts/shared';

export const metadata = { title: 'Agenda' };

export default async function AdminAgendaPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from('events').select('*').order('starts_at', { ascending: false });

  const list = (events ?? []) as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Agenda</h1>
        <p className="mt-1 text-cream/50">Mentorias, lives, eventos e webinars.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <EventForm />

        <div>
          {list.length > 0 ? (
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="border-b border-line/60 text-left text-cream/50">
                  <tr>
                    <th className="px-5 py-3 font-medium">Evento</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Início</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {list.map((ev) => (
                    <tr key={ev.id} className="text-cream/80">
                      <td className="px-5 py-3">
                        <p className="font-medium text-cream">{ev.title}</p>
                        {ev.location && <p className="text-xs text-cream/40">{ev.location}</p>}
                      </td>
                      <td className="px-5 py-3">{EVENT_TYPE_LABELS[ev.type as keyof typeof EVENT_TYPE_LABELS] ?? ev.type}</td>
                      <td className="px-5 py-3 text-cream/60">{formatDateTime(ev.starts_at)}</td>
                      <td className="px-5 py-3">{ev.published ? <Badge tone="success">Publicado</Badge> : <Badge>Rascunho</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <EmptyState title="Nenhum evento" description="Crie o primeiro evento usando o formulário ao lado." />
          )}
        </div>
      </div>
    </div>
  );
}
