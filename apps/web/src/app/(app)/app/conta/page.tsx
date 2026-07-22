import { User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AccountTabs } from '@/components/AccountTabs';

export const metadata = { title: 'Minha Conta' };

const TABS = ['perfil', 'assinatura', 'pagamentos', 'downloads', 'notificacoes', 'config'] as const;
type Tab = (typeof TABS)[number];

export default async function ContaPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const tab: Tab = TABS.includes(searchParams.tab as Tab) ? (searchParams.tab as Tab) : 'perfil';

  const [{ data: profile }, { data: subscription }, { data: orders }, { data: downloads }, { data: notifications }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', user!.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('orders').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase
        .from('downloads')
        .select('*, library_items(title, type, file_url)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', user!.id).eq('audience', 'user').order('created_at', { ascending: false }).limit(50),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-cream">
          <User size={26} className="text-gold" /> Minha Conta
        </h1>
        <p className="mt-1 text-cream/50">Gerencie seu perfil, assinatura, pagamentos e preferências.</p>
      </div>

      <AccountTabs
        activeTab={tab}
        userId={user!.id}
        userEmail={user!.email ?? ''}
        profile={profile ?? null}
        subscription={subscription ?? null}
        orders={orders ?? []}
        downloads={downloads ?? []}
        notifications={notifications ?? []}
      />
    </div>
  );
}
