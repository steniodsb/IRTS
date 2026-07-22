import Link from 'next/link';
import { Calendar, MapPin, Clock, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui';
import { EVENT_TYPE_LABELS, formatDate, formatDateTime, type EventType } from '@irts/shared';
import { EventRegisterButton } from '@/components/EventRegisterButton';

export const metadata = { title: 'Agenda' };

export default async function AgendaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const nowIso = new Date().toISOString();

  const [{ data: upcoming }, { data: past }, { data: registrations }] = await Promise.all([
    supabase.from('events').select('*').eq('published', true).gte('starts_at', nowIso).order('starts_at', { ascending: true }),
    supabase.from('events').select('*').eq('published', true).lt('starts_at', nowIso).order('starts_at', { ascending: false }).limit(6),
    supabase.from('event_registrations').select('event_id').eq('user_id', user!.id),
  ]);

  const registeredIds = new Set((registrations ?? []).map((r: any) => r.event_id));

  // Agrupa próximos eventos por dia.
  const groups: Record<string, any[]> = {};
  for (const ev of upcoming ?? []) {
    const key = formatDate(ev.starts_at, { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });
    (groups[key] ??= []).push(ev);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-cream">
          <Calendar size={26} className="text-gold" /> Agenda
        </h1>
        <p className="mt-1 text-cream/50">Mentorias, lives, webinars e eventos exclusivos.</p>
      </div>

      {/* Próximos eventos */}
      {upcoming && upcoming.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groups).map(([day, evs]) => (
            <section key={day}>
              <h2 className="mb-3 font-serif text-lg capitalize text-gold">{day}</h2>
              <div className="space-y-4">
                {evs.map((ev: any) => (
                  <Card key={ev.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Badge tone="gold">{EVENT_TYPE_LABELS[ev.type as EventType] ?? ev.type}</Badge>
                      <p className="mt-2 font-medium text-cream">{ev.title}</p>
                      {ev.description && <p className="mt-1 line-clamp-2 text-sm text-cream/55">{ev.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream/45">
                        <span className="inline-flex items-center gap-1"><Clock size={12} /> {formatDateTime(ev.starts_at)}</span>
                        {ev.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {ev.location}</span>}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <EventRegisterButton
                        eventId={ev.id}
                        userId={user!.id}
                        joinUrl={ev.join_url}
                        registered={registeredIds.has(ev.id)}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum evento agendado" description="Novos eventos aparecerão aqui assim que forem publicados." />
      )}

      {/* Eventos passados */}
      {past && past.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-cream">
            <History size={18} className="text-cream/50" /> Eventos passados
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((ev: any) => (
              <Card key={ev.id} className="opacity-70">
                <div className="flex items-center gap-2">
                  <Badge>{EVENT_TYPE_LABELS[ev.type as EventType] ?? ev.type}</Badge>
                  <span className="text-xs text-cream/40">{formatDate(ev.starts_at)}</span>
                </div>
                <p className="mt-2 font-medium text-cream">{ev.title}</p>
                {ev.join_url && (
                  <Link href={ev.join_url} target="_blank" className="mt-2 inline-block text-sm text-gold hover:underline">
                    Ver gravação →
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
