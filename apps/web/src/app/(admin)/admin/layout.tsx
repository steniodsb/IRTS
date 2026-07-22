import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/AdminNav';

export const metadata = { title: { default: 'Admin', template: '%s · Admin IRTS' } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    redirect('/app');
  }

  return <AdminNav>{children}</AdminNav>;
}
