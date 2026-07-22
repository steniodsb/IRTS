import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock, PlayCircle, Award, Paperclip } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, Progress, LinkButton } from '@/components/ui';
import { LessonList } from '@/components/LessonList';

export const metadata = { title: 'Curso' };

/** Converte a URL do vídeo em URL de embed para youtube/vimeo. */
function embedUrl(provider: string, url: string | null): string | null {
  if (!url) return null;
  if (provider === 'youtube') {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : url;
  }
  if (provider === 'vimeo') {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : url;
  }
  return url;
}

export default async function CoursePlayerPage({
  params, searchParams,
}: {
  params: { slug: string };
  searchParams: { aula?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from('courses').select('*').eq('slug', params.slug).eq('published', true).maybeSingle();
  if (!course) notFound();

  const [{ data: modules }, { data: lessons }, { data: progress }, { data: enrollment }, { data: certificate }] =
    await Promise.all([
      supabase.from('modules').select('*').eq('course_id', course.id).order('sort_order'),
      supabase.from('lessons').select('*').eq('course_id', course.id).eq('published', true).order('sort_order'),
      supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', user!.id).eq('course_id', course.id),
      supabase.from('enrollments').select('*').eq('user_id', user!.id).eq('course_id', course.id).maybeSingle(),
      supabase.from('certificates').select('*').eq('user_id', user!.id).eq('course_id', course.id).maybeSingle(),
    ]);

  const allLessons = lessons ?? [];
  const completedIds = new Set((progress ?? []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));
  const hasEnrollment = !!enrollment;

  // Aula selecionada (via ?aula=) ou a primeira publicada.
  const selected = allLessons.find((l: any) => l.id === searchParams.aula) ?? allLessons[0] ?? null;

  const canAccess = (lesson: any) => hasEnrollment || course.is_free || lesson?.is_preview;
  const selectedAccessible = selected ? canAccess(selected) : false;

  const total = allLessons.length;
  const done = allLessons.filter((l: any) => completedIds.has(l.id)).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  // Estrutura módulos + aulas para o componente cliente.
  const structure = [
    ...(modules ?? []).map((m: any) => ({
      id: m.id,
      title: m.title,
      lessons: allLessons.filter((l: any) => l.module_id === m.id),
    })),
    // aulas sem módulo
    ...(allLessons.some((l: any) => !l.module_id)
      ? [{ id: 'sem-modulo', title: 'Aulas', lessons: allLessons.filter((l: any) => !l.module_id) }]
      : []),
  ].filter((m) => m.lessons.length > 0);

  const embed = selected ? embedUrl(selected.video_provider, selected.video_url) : null;

  return (
    <div className="space-y-6">
      <Link href="/app/cursos" className="inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-gold">
        <ArrowLeft size={16} /> Voltar aos cursos
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Área do vídeo */}
        <div className="space-y-5 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-line bg-black">
            <div className="aspect-video w-full">
              {!selected ? (
                <div className="flex h-full w-full items-center justify-center text-cream/40">Nenhuma aula disponível.</div>
              ) : !selectedAccessible ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
                  <Lock size={36} className="text-gold" />
                  <div>
                    <p className="font-serif text-xl text-cream">Conteúdo exclusivo</p>
                    <p className="mt-1 text-sm text-cream/55">Assine para acessar todas as aulas deste curso.</p>
                  </div>
                  <LinkButton href="/planos" variant="gold">Assine para acessar</LinkButton>
                </div>
              ) : selected.video_provider === 'upload' || !embed ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface text-cream/40">
                  <PlayCircle size={40} />
                  <p className="text-sm">Vídeo em processamento.</p>
                </div>
              ) : (
                <iframe
                  key={selected.id}
                  src={embed}
                  title={selected.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {course.category && <Badge tone="gold">{course.category}</Badge>}
              {course.is_free && <Badge tone="success">Gratuito</Badge>}
            </div>
            <h1 className="mt-2 font-serif text-2xl text-cream">{selected?.title ?? course.title}</h1>
            {selected?.description && <p className="mt-2 text-cream/60">{selected.description}</p>}
            {!selected && course.description && <p className="mt-2 text-cream/60">{course.description}</p>}

            {/* Anexos */}
            {selectedAccessible && selected?.attachments?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-cream/70">Materiais desta aula</p>
                {selected.attachments.map((a: any, i: number) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-gold hover:underline">
                    <Paperclip size={14} /> {a.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Currículo + progresso */}
        <div className="space-y-5">
          <Card>
            <p className="font-medium text-cream">{course.title}</p>
            <div className="mt-3"><Progress value={pct} /></div>
            <p className="mt-1.5 text-xs text-cream/50">{done} de {total} aulas · {pct.toFixed(0)}%</p>

            {certificate && (
              <a
                href={certificate.pdf_url ?? '#'}
                target={certificate.pdf_url ? '_blank' : undefined}
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10"
              >
                <Award size={16} /> Baixar certificado
              </a>
            )}

            {!hasEnrollment && !course.is_free && (
              <LinkButton href="/planos" variant="gold" className="mt-4 w-full">Assine para acessar</LinkButton>
            )}
          </Card>

          <LessonList
            courseId={course.id}
            courseSlug={course.slug}
            structure={structure}
            completedIds={Array.from(completedIds)}
            selectedId={selected?.id ?? null}
            canAccessFree={course.is_free}
            hasEnrollment={hasEnrollment}
            userId={user!.id}
          />
        </div>
      </div>
    </div>
  );
}
