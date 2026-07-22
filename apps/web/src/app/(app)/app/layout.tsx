import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MemberNav } from '@/components/MemberNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/app');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single();

  const isAdmin = !!profile && ['admin', 'owner'].includes(profile.role);

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('audience', 'user').eq('user_id', user.id).is('read_at', null);

  return (
    <MemberNav profile={profile ?? null} isAdmin={isAdmin} unread={count ?? 0}>
      {children}
    </MemberNav>
  );
}
