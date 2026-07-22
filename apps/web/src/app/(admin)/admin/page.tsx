import Link from 'next/link';
import {
  Users, CreditCard, GraduationCap, ShoppingBag, BookMarked, Bell,
  ShoppingCart, CheckCircle2, LogOut, UserPlus, CalendarClock, XCircle, Info,
} from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { relativeTime } from '@irts/shared';

export const metadata = { title: 'Dashboard' };

const NOTIF_ICON: Record<string, any> = {
  purchase: ShoppingCart,
  course_completed: CheckCircle2,
  course_abandoned: LogOut,
  new_signup: UserPlus,
  new_forum_post: Users,
  event_reminder: CalendarClock,
  subscription_canceled: XCircle,
  system: Info,
};

export default async function AdminDashboard() {
  const supabase = createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    usersCount, subsCount, coursesCount, ordersCount, enrollCount,
    { data: notifications }, unreadCount,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid').gte('created_at', startOfMonth.toISOString()),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*').eq('audience', 'owner').order('created_at', { ascending: false }).limit(15),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('audience', 'owner').is('read_at', null),
  ]);

  const kpis = [
    { icon: Users, label: 'Usuários', value: usersCount.count ?? 0 },
    { icon: CreditCard, label: 'Assinaturas ativas', value: subsCount.count ?? 0 },
    { icon: GraduationCap, label: 'Cursos publicados', value: coursesCount.count ?? 0 },
    { icon: ShoppingBag, label: 'Pedidos pagos no mês', value: ordersCount.count ?? 0 },
    { icon: BookMarked, label: 'Matrículas', value: enrollCount.count ?? 0 },
  ];

  const notifs = (notifications ?? []) as any[];
  const unread = unreadCount.count ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-cream">Dashboard</h1>
        <p className="mt-1 text-cream/50">Visão geral da plataforma IRTS.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <k.icon className="text-gold" size={22} />
            <p className="mt-3 text-3xl font-semibold text-cream">{k.value}</p>
            <p className="mt-1 text-sm text-cream/50">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Notificações do dono */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="flex items-center gap-2 font-serif text-xl text-cream">
            <Bell size={20} className="text-gold" /> Atividade recente
          </h2>
          {unread > 0 && <Badge tone="gold">{unread} não lida{unread === 1 ? '' : 's'}</Badge>}
          <Link href="/admin/notificacoes" className="ml-auto text-sm text-gold hover:underline">Ver todas →</Link>
        </div>

        {notifs.length > 0 ? (
          <Card className="divide-y divide-line/60 p-0">
            {notifs.map((n) => {
              const Icon = NOTIF_ICON[n.type] ?? Info;
              const isUnread = !n.read_at;
              return (
                <div key={n.id} className={`flex items-start gap-3 px-5 py-4 ${isUnread ? 'bg-gold/[0.03]' : ''}`}>
                  <Icon size={18} className={isUnread ? 'mt-0.5 text-gold' : 'mt-0.5 text-cream/40'} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-cream">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-cream/50">{n.body}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-cream/40">{relativeTime(n.created_at)}</span>
                </div>
              );
            })}
          </Card>
        ) : (
          <EmptyState title="Nenhuma notificação" description="Compras, conclusões e abandonos de cursos aparecerão aqui." />
        )}
      </section>
    </div>
  );
}
