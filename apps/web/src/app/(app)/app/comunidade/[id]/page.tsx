import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageSquare, Eye, Lock, Pin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { relativeTime, initials } from '@irts/shared';
import { ReplyForm } from '@/components/ReplyForm';

export const metadata = { title: 'Tópico' };

function Avatar({ name, url }: { name: string | null; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
      {initials(name)}
    </span>
  );
}

export default async function ThreadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('*, profiles(full_name, avatar_url), forum_categories(name)')
    .eq('id', params.id)
    .maybeSingle();
  if (!thread) notFound();

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(full_name, avatar_url)')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  const replies = posts ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/app/comunidade" className="inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-gold">
        <ArrowLeft size={16} /> Voltar à comunidade
      </Link>

      {/* Tópico original */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {thread.pinned && <Badge tone="gold"><Pin size={11} className="mr-1" /> Fixado</Badge>}
          {thread.forum_categories?.name && <Badge>{thread.forum_categories.name}</Badge>}
          {thread.locked && <Badge tone="warning"><Lock size={11} className="mr-1" /> Fechado</Badge>}
        </div>
        <h1 className="font-serif text-2xl text-cream">{thread.title}</h1>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={thread.profiles?.full_name} url={thread.profiles?.avatar_url} />
          <div className="text-sm">
            <p className="text-cream">{thread.profiles?.full_name ?? 'Membro'}</p>
            <p className="text-xs text-cream/40">{relativeTime(thread.created_at)}</p>
          </div>
        </div>
        <Card className="mt-4">
          <p className="whitespace-pre-wrap text-cream/85">{thread.body}</p>
        </Card>
        <div className="mt-3 flex items-center gap-4 text-xs text-cream/40">
          <span className="inline-flex items-center gap-1"><Eye size={13} /> {thread.views} visualizações</span>
          <span className="inline-flex items-center gap-1"><MessageSquare size={13} /> {replies.length} {replies.length === 1 ? 'resposta' : 'respostas'}</span>
        </div>
      </div>

      {/* Respostas */}
      <section className="space-y-4">
        <h2 className="font-serif text-lg text-cream">Respostas</h2>
        {replies.length > 0 ? (
          replies.map((p: any) => (
            <div key={p.id} className="flex gap-3">
              <Avatar name={p.profiles?.full_name} url={p.profiles?.avatar_url} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-cream">{p.profiles?.full_name ?? 'Membro'}</span>
                  <span className="text-xs text-cream/40">{relativeTime(p.created_at)}</span>
                </div>
                <Card className="mt-1.5 p-4">
                  <p className="whitespace-pre-wrap text-sm text-cream/85">{p.body}</p>
                </Card>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-cream/45">Nenhuma resposta ainda. Seja o primeiro a responder.</p>
        )}
      </section>

      {/* Formulário de resposta */}
      {thread.locked ? (
        <Card className="flex items-center gap-2 text-sm text-cream/50">
          <Lock size={16} /> Este tópico está fechado para novas respostas.
        </Card>
      ) : (
        <ReplyForm threadId={thread.id} userId={user!.id} />
      )}
    </div>
  );
}
