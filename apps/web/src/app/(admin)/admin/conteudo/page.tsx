import { Card, Badge } from '@/components/ui';
import { NewsForm, AnnouncementForm, UpdateForm } from '@/components/admin/ContentForms';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@irts/shared';

export const metadata = { title: 'Conteúdo' };

export default async function AdminConteudoPage() {
  const supabase = createClient();
  const [{ data: news }, { data: announcements }, { data: updates }] = await Promise.all([
    supabase.from('news').select('*').order('published_at', { ascending: false }).limit(8),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('platform_updates').select('*').order('created_at', { ascending: false }).limit(8),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Conteúdo do Início</h1>
        <p className="mt-1 text-cream/50">Publique notícias, avisos e atualizações da plataforma.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notícias */}
        <div className="space-y-4">
          <NewsForm />
          <RecentList
            title="Notícias recentes"
            table="news"
            items={(news ?? []).map((n: any) => ({ id: n.id, title: n.title, meta: formatDate(n.published_at), published: n.published }))}
          />
        </div>

        {/* Avisos */}
        <div className="space-y-4">
          <AnnouncementForm />
          <RecentList
            title="Avisos recentes"
            table="announcements"
            items={(announcements ?? []).map((a: any) => ({ id: a.id, title: a.title, meta: formatDate(a.created_at), badge: a.level, published: a.published }))}
          />
        </div>

        {/* Atualizações */}
        <div className="space-y-4">
          <UpdateForm />
          <RecentList
            title="Atualizações recentes"
            table="platform_updates"
            items={(updates ?? []).map((u: any) => ({ id: u.id, title: u.title, meta: u.version ? `v${u.version} · ${formatDate(u.created_at)}` : formatDate(u.created_at) }))}
          />
        </div>
      </div>
    </div>
  );
}

function RecentList({ title, table, items }: {
  title: string;
  table: string;
  items: { id: string; title: string; meta: string; badge?: string; published?: boolean }[];
}) {
  return (
    <Card className="p-0">
      <p className="border-b border-line/60 px-5 py-3 text-sm font-medium text-cream/60">{title}</p>
      {items.length > 0 ? (
        <ul className="divide-y divide-line/60">
          {items.map((it) => (
            <li key={it.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-cream">{it.title}</p>
                <div className="flex items-center gap-2">
                  {it.badge && <Badge tone={it.badge === 'warning' ? 'warning' : it.badge === 'success' ? 'success' : 'default'}>{it.badge}</Badge>}
                  <RowActions table={table} id={it.id} published={it.published} label="o item" />
                </div>
              </div>
              <p className="text-xs text-cream/40">{it.meta}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-6 text-center text-sm text-cream/40">Nada publicado ainda.</p>
      )}
    </Card>
  );
}
