import Link from 'next/link';
import { Users, MessageSquare, Pin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui';
import { relativeTime, initials } from '@irts/shared';
import { NewThreadForm } from '@/components/NewThreadForm';

export const metadata = { title: 'Comunidade' };

export default async function ComunidadePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: categories }, { data: threads }] = await Promise.all([
    supabase.from('forum_categories').select('*').order('sort_order'),
    supabase
      .from('forum_threads')
      .select('*, profiles(full_name, avatar_url), forum_categories(name)')
      .order('pinned', { ascending: false })
      .order('last_activity_at', { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl text-cream">
            <Users size={26} className="text-gold" /> Comunidade
          </h1>
          <p className="mt-1 text-cream/50">Troque experiências, tire dúvidas e faça networking com outros membros.</p>
        </div>
        <NewThreadForm categories={categories ?? []} userId={user!.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Categorias */}
        <aside className="space-y-2 lg:col-span-1">
          <p className="px-1 text-xs uppercase tracking-wide text-cream/40">Categorias</p>
          {categories && categories.length > 0 ? (
            categories.map((c: any) => (
              <Card key={c.id} className="p-3">
                <p className="text-sm font-medium text-cream">{c.name}</p>
                {c.description && <p className="mt-0.5 text-xs text-cream/45">{c.description}</p>}
              </Card>
            ))
          ) : (
            <p className="px-1 text-sm text-cream/40">Nenhuma categoria ainda.</p>
          )}
        </aside>

        {/* Tópicos recentes */}
        <section className="space-y-3 lg:col-span-3">
          <p className="px-1 text-xs uppercase tracking-wide text-cream/40">Tópicos recentes</p>
          {threads && threads.length > 0 ? (
            threads.map((t: any) => (
              <Link key={t.id} href={`/app/comunidade/${t.id}`}>
                <Card className="transition hover:border-gold/50">
                  <div className="flex items-start gap-3">
                    {t.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.profiles.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
                        {initials(t.profiles?.full_name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {t.pinned && <Pin size={13} className="shrink-0 text-gold" />}
                        <p className="truncate font-medium text-cream">{t.title}</p>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-sm text-cream/50">{t.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream/40">
                        <span>{t.profiles?.full_name ?? 'Membro'}</span>
                        {t.forum_categories?.name && <Badge>{t.forum_categories.name}</Badge>}
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare size={12} /> {t.reply_count} {t.reply_count === 1 ? 'resposta' : 'respostas'}
                        </span>
                        <span>{relativeTime(t.last_activity_at)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <EmptyState title="Ainda não há tópicos" description="Seja o primeiro a iniciar uma conversa na comunidade." />
          )}
        </section>
      </div>
    </div>
  );
}
