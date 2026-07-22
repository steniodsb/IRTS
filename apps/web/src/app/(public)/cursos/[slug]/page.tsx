import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlayCircle, Lock, Clock, GraduationCap } from 'lucide-react';
import { Badge, LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { formatBRL, formatDuration } from '@irts/shared';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: course } = await supabase
    .from('courses').select('title, subtitle').eq('slug', params.slug).maybeSingle();
  if (!course) return { title: 'Curso' };
  return { title: course.title, description: course.subtitle ?? undefined };
}

export default async function CourseSalesPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: course } = await supabase
    .from('courses').select('*').eq('slug', params.slug).eq('published', true).maybeSingle();

  if (!course) notFound();

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase.from('modules').select('*').eq('course_id', course.id).order('sort_order'),
    supabase.from('lessons').select('*').eq('course_id', course.id).eq('published', true).order('sort_order'),
  ]);

  const allLessons = (lessons ?? []) as any[];
  const mods = (modules ?? []) as any[];
  const totalSeconds = allLessons.reduce((acc, l) => acc + (l.duration_seconds ?? 0), 0);

  // Agrupa aulas por módulo; aulas sem módulo vão para um grupo "Conteúdo".
  const grouped: { title: string; lessons: any[] }[] = [];
  for (const m of mods) {
    grouped.push({ title: m.title, lessons: allLessons.filter((l) => l.module_id === m.id) });
  }
  const orphan = allLessons.filter((l) => !l.module_id);
  if (orphan.length) grouped.push({ title: 'Conteúdo', lessons: orphan });

  const price = course.is_free
    ? 'Gratuito'
    : course.price_cents ? formatBRL(course.price_cents) : 'Incluso no plano';

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.12),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.4fr_1fr]">
          <div>
            {course.category && <Badge tone="gold">{course.category}</Badge>}
            <h1 className="mt-5 font-serif text-4xl leading-tight text-cream md:text-5xl">{course.title}</h1>
            {course.subtitle && <p className="mt-4 text-lg text-cream/60">{course.subtitle}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-cream/55">
              {course.instructor && <span className="inline-flex items-center gap-1.5"><GraduationCap size={16} className="text-gold" /> {course.instructor}</span>}
              {course.level && <span className="capitalize">Nível: {course.level}</span>}
              {totalSeconds > 0 && <span className="inline-flex items-center gap-1.5"><Clock size={16} className="text-gold" /> {formatDuration(totalSeconds)}</span>}
              <span>{allLessons.length} aula{allLessons.length === 1 ? '' : 's'}</span>
            </div>
          </div>

          {/* Cartão de compra */}
          <div className="card h-fit overflow-hidden p-0">
            <div className="relative aspect-video bg-surface-alt">
              {course.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cream/20"><PlayCircle size={44} /></div>
              )}
            </div>
            <div className="p-6">
              <p className="text-3xl font-semibold text-gold">{price}</p>
              <LinkButton href="/cadastro" variant="gold" className="mt-5 w-full">
                {course.is_free ? 'Começar' : 'Entrar para acessar'}
              </LinkButton>
              <p className="mt-3 text-center text-xs text-cream/40">
                {course.is_free ? 'Crie sua conta gratuita para assistir.' : 'Acesso liberado após entrar na plataforma.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-[1.4fr_1fr]">
        {/* DESCRIÇÃO + CURRÍCULO */}
        <div>
          {course.description && (
            <div className="mb-12">
              <h2 className="font-serif text-2xl text-cream">Sobre o curso</h2>
              <p className="mt-4 whitespace-pre-line text-cream/60">{course.description}</p>
            </div>
          )}

          <h2 className="font-serif text-2xl text-cream">Conteúdo do curso</h2>
          <div className="mt-5 space-y-3">
            {grouped.length > 0 ? grouped.map((g, i) => (
              <details key={i} className="card overflow-hidden p-0" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-cream hover:text-gold">
                  <span className="font-medium">{g.title}</span>
                  <span className="text-xs text-cream/40">{g.lessons.length} aula{g.lessons.length === 1 ? '' : 's'}</span>
                </summary>
                <ul className="border-t border-line/60">
                  {g.lessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="flex items-center gap-2.5 text-cream/70">
                        {l.is_preview ? <PlayCircle size={16} className="text-gold" /> : <Lock size={15} className="text-cream/30" />}
                        {l.title}
                        {l.is_preview && <Badge tone="success">Amostra</Badge>}
                      </span>
                      {l.duration_seconds > 0 && <span className="text-xs text-cream/40">{formatDuration(l.duration_seconds)}</span>}
                    </li>
                  ))}
                  {g.lessons.length === 0 && <li className="px-5 py-3 text-sm text-cream/40">Em breve.</li>}
                </ul>
              </details>
            )) : (
              <p className="text-sm text-cream/40">Conteúdo em preparação.</p>
            )}
          </div>
        </div>

        {/* LATERAL */}
        <aside>
          <div className="card sticky top-24 p-6">
            <h3 className="font-serif text-xl text-cream">Pronto para começar?</h3>
            <p className="mt-2 text-sm text-cream/55">
              {course.is_free
                ? 'Este curso é gratuito. Crie sua conta e comece agora.'
                : 'Entre na plataforma para acessar todo o conteúdo deste curso.'}
            </p>
            <LinkButton href="/cadastro" variant="gold" className="mt-5 w-full">
              {course.is_free ? 'Começar' : 'Entrar para acessar'}
            </LinkButton>
            <Link href="/cursos" className="mt-4 block text-center text-sm text-gold hover:underline">Ver todos os cursos</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
