import { BioForm } from '@/components/admin/BioForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Sobre / Bio' };

export default async function AdminSobrePage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['bio', 'home_media']);

  const map = new Map((settings ?? []).map((s: any) => [s.key, s.value]));
  const bio: any = map.get('bio') ?? {};
  const homeMedia: any = map.get('home_media') ?? {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Sobre / Bio</h1>
        <p className="mt-1 text-cream/50">
          Edite a biografia de Newton dos Anjos, as credenciais e a mídia institucional da home.
        </p>
      </div>

      <BioForm bio={bio} homeMedia={homeMedia} />
    </div>
  );
}
