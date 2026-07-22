import { NotificationsList } from '@/components/admin/NotificationsList';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Notificações' };

export default async function AdminNotificacoesPage() {
  const supabase = createClient();
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, read_at, created_at')
    .eq('audience', 'owner')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-cream">Notificações</h1>
        <p className="mt-1 text-cream/50">Compras, conclusões, abandonos e demais alertas da plataforma.</p>
      </div>
      <NotificationsList initial={(notifications ?? []) as any} />
    </div>
  );
}
