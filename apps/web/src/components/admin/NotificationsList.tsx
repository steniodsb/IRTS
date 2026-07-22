'use client';
import { useMemo, useState } from 'react';
import {
  ShoppingCart, CheckCircle2, LogOut, UserPlus, Users, CalendarClock, XCircle, Info, Check, CheckCheck,
} from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { relativeTime } from '@irts/shared';

const ICON: Record<string, any> = {
  purchase: ShoppingCart, course_completed: CheckCircle2, course_abandoned: LogOut,
  new_signup: UserPlus, new_forum_post: Users, event_reminder: CalendarClock,
  subscription_canceled: XCircle, system: Info,
};

const TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra', course_completed: 'Curso concluído', course_abandoned: 'Curso abandonado',
  new_signup: 'Novo cadastro', new_forum_post: 'Fórum', event_reminder: 'Evento',
  subscription_canceled: 'Assinatura cancelada', system: 'Sistema',
};

type Notif = { id: string; type: string; title: string; body: string | null; read_at: string | null; created_at: string };

export function NotificationsList({ initial }: { initial: Notif[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<Notif[]>(initial);
  const [filter, setFilter] = useState<string>('all');

  const types = useMemo(() => Array.from(new Set(initial.map((n) => n.type))), [initial]);
  const visible = filter === 'all' ? items : items.filter((n) => n.type === filter);
  const unreadCount = items.filter((n) => !n.read_at).length;

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  }

  async function markAll() {
    const now = new Date().toISOString();
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!ids.length) return;
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase.from('notifications').update({ read_at: now }).in('id', ids);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter('all')}
          className={`chip ${filter === 'all' ? 'border-gold text-gold' : ''}`}>Todas</button>
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`chip ${filter === t ? 'border-gold text-gold' : ''}`}>{TYPE_LABELS[t] ?? t}</button>
        ))}
        {unreadCount > 0 && (
          <button onClick={markAll} className="btn-outline ml-auto py-1.5 text-xs">
            <CheckCheck size={15} /> Marcar todas como lidas ({unreadCount})
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <Card className="divide-y divide-line/60 p-0">
          {visible.map((n) => {
            const Icon = ICON[n.type] ?? Info;
            const unread = !n.read_at;
            return (
              <div key={n.id} className={`flex items-start gap-3 px-5 py-4 ${unread ? 'bg-gold/[0.03]' : ''}`}>
                <Icon size={18} className={unread ? 'mt-0.5 text-gold' : 'mt-0.5 text-cream/40'} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-cream">{n.title}</p>
                    <Badge>{TYPE_LABELS[n.type] ?? n.type}</Badge>
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-cream/50">{n.body}</p>}
                  <p className="mt-1 text-xs text-cream/40">{relativeTime(n.created_at)}</p>
                </div>
                {unread && (
                  <button onClick={() => markRead(n.id)} className="shrink-0 text-cream/40 hover:text-gold" title="Marcar como lida">
                    <Check size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </Card>
      ) : (
        <EmptyState title="Nenhuma notificação" description="Não há notificações para este filtro." />
      )}
    </div>
  );
}
