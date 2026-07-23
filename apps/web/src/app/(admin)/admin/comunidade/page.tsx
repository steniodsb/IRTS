import { MessageSquare, Pin, Lock } from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { CategoryManager, ThreadModActions } from '@/components/admin/ForumAdmin';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@irts/shared';

export const metadata = { title: 'Comunidade' };

export default async function AdminComunidadePage() {
  const supabase = createClient();
  const [{ data: threads }, { data: categories }, { count: postCount }] = await Promise.all([
    supabase.from('forum_threads').select('*, profiles(full_name), forum_categories(name)').order('last_activity_at', { ascending: false }).limit(50),
    supabase.from('forum_categories').select('id, name, slug').order('sort_order'),
    supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
  ]);

  const list = (threads ?? []) as any[];
  const cats = (categories ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-cream">Comunidade</h1>
        <p className="mt-1 text-cream/50">Acompanhe as discussões do fórum.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><MessageSquare className="text-gold" size={22} /><p className="mt-3 text-3xl font-semibold text-cream">{list.length}</p><p className="mt-1 text-sm text-cream/50">Tópicos recentes</p></Card>
        <Card><p className="text-3xl font-semibold text-cream">{cats.length}</p><p className="mt-1 text-sm text-cream/50">Categorias</p></Card>
        <Card><p className="text-3xl font-semibold text-cream">{postCount ?? 0}</p><p className="mt-1 text-sm text-cream/50">Respostas</p></Card>
      </div>

      <CategoryManager categories={cats} />

      {list.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line/60 text-left text-cream/50">
              <tr>
                <th className="px-5 py-3 font-medium">Tópico</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Autor</th>
                <th className="px-5 py-3 font-medium">Respostas</th>
                <th className="px-5 py-3 font-medium">Atividade</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {list.map((t) => (
                <tr key={t.id} className="text-cream/80">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 font-medium text-cream">
                      {t.pinned && <Pin size={14} className="text-gold" />}
                      {t.locked && <Lock size={14} className="text-cream/40" />}
                      {t.title}
                    </span>
                  </td>
                  <td className="px-5 py-3">{t.forum_categories?.name ? <Badge tone="gold">{t.forum_categories.name}</Badge> : '—'}</td>
                  <td className="px-5 py-3">{t.profiles?.full_name ?? '—'}</td>
                  <td className="px-5 py-3">{t.reply_count}</td>
                  <td className="px-5 py-3 text-cream/50">{formatDate(t.last_activity_at)}</td>
                  <td className="px-5 py-3"><ThreadModActions thread={{ id: t.id, pinned: t.pinned, locked: t.locked }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Nenhuma discussão" description="Os tópicos criados pelos membros aparecerão aqui." />
      )}
    </div>
  );
}
