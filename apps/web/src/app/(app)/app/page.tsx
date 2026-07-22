import Link from 'next/link';
import { Calendar, Megaphone, Newspaper, Sparkles, PlayCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, Progress, EmptyState } from '@/components/ui';
import { formatDate, formatDateTime, relativeTime } from '@irts/shared';

export const metadata = { title: 'Início' };

export default async function InicioPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: news }, { data: announcements }, { data: nextEvent }, { data: updates }, { data: enrollments }] =
    await Promise.all([
      supabase.from('news').select('*').eq('published', true).order('published_at', { ascending: false }).limit(4),
      supabase.from('announcements').select('*').eq('published', true).order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('*').eq('published', true).gte('starts_at', new Date().toISOString()).order('starts_at').limit(1).maybeSingle(),
      supabase.from('platform_updates').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('enrollments').select('*, courses(title, slug)').eq('user_id', user!.id).is('completed_at', null).order('last_activity_at', { ascending: false, nullsFirst: false }).limit(3),
    ]);

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-cream">Olá{firstName ? `, ${firstName}` : ''} 👋</h1>
        <p className="mt-1 text-cream/50">Veja o que há de novo na plataforma.</p>
      </div>

      {/* Continuar assistindo */}
      {enrollments && enrollments.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-cream"><PlayCircle size={20} className="text-gold" /> Continuar assistindo</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e: any) => (
              <Link key={e.id} href={`/app/cursos/${e.courses?.slug}`}>
                <Card className="h-full transition hover:border-gold/50">
                  <div className="mb-3 aspect-video rounded-lg bg-surface-alt" />
                  <p className="font-medium text-cream">{e.courses?.title}</p>
                  <div className="mt-3"><Progress value={Number(e.progress_pct)} /></div>
                  <p className="mt-1.5 text-xs text-cream/50">{Number(e.progress_pct).toFixed(0)}% concluído</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notícias */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="flex items-center gap-2 font-serif text-xl text-cream"><Newspaper size={20} className="text-gold" /> Últimas notícias trabalhistas</h2>
          {news && news.length > 0 ? news.map((n) => (
            <Card key={n.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-cream">{n.title}</p>
                  {n.summary && <p className="mt-1 text-sm text-cream/55">{n.summary}</p>}
                  <p className="mt-2 text-xs text-cream/40">{n.source} · {formatDate(n.published_at)}</p>
                </div>
                {n.url && <Link href={n.url} target="_blank" className="shrink-0 text-sm text-gold hover:underline">Ler →</Link>}
              </div>
            </Card>
          )) : <EmptyState title="Sem notícias ainda" description="As notícias trabalhistas aparecerão aqui." />}
        </section>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Próxima live */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-cream"><Calendar size={20} className="text-gold" /> Próxima live</h2>
            {nextEvent ? (
              <Card>
                <Badge tone="gold">{nextEvent.type}</Badge>
                <p className="mt-2 font-medium text-cream">{nextEvent.title}</p>
                <p className="mt-1 text-sm text-cream/50">{formatDateTime(nextEvent.starts_at)}</p>
                {nextEvent.join_url && <Link href={nextEvent.join_url} target="_blank" className="mt-3 inline-block text-sm text-gold hover:underline">Entrar →</Link>}
              </Card>
            ) : <EmptyState title="Nada agendado" />}
          </section>

          {/* Avisos */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-cream"><Megaphone size={20} className="text-gold" /> Avisos</h2>
            <div className="space-y-3">
              {announcements?.map((a) => (
                <Card key={a.id}><p className="font-medium text-cream">{a.title}</p>{a.body && <p className="mt-1 text-sm text-cream/55">{a.body}</p>}</Card>
              ))}
            </div>
          </section>

          {/* Atualizações da plataforma */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-cream"><Sparkles size={20} className="text-gold" /> Atualizações</h2>
            <div className="space-y-2">
              {updates?.map((u) => (
                <div key={u.id} className="text-sm">
                  <span className="text-gold">{u.version}</span> <span className="text-cream/70">{u.title}</span>
                  <span className="block text-xs text-cream/40">{relativeTime(u.created_at)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
