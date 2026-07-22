import Link from 'next/link';
import { GraduationCap, Compass, Award, PlayCircle, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, Progress, EmptyState, LinkButton } from '@/components/ui';

export const metadata = { title: 'Meus Cursos' };

export default async function CursosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: enrollments }, { data: published }, { data: certificates }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', user!.id)
      .order('last_activity_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('courses')
      .select('*')
      .eq('published', true)
      .order('sort_order'),
    supabase
      .from('certificates')
      .select('course_id')
      .eq('user_id', user!.id),
  ]);

  const enrolled = enrollments ?? [];
  const enrolledIds = new Set(enrolled.map((e: any) => e.course_id));
  const certIds = new Set((certificates ?? []).map((c: any) => c.course_id));
  const explore = (published ?? []).filter((c: any) => !enrolledIds.has(c.id));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-cream">Meus Cursos</h1>
        <p className="mt-1 text-cream/50">Continue de onde parou e conquiste seus certificados.</p>
      </div>

      {/* Matrículas */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-serif text-xl text-cream">
          <GraduationCap size={20} className="text-gold" /> Em andamento
        </h2>
        {enrolled.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enrolled.map((e: any) => {
              const course = e.courses;
              const pct = Number(e.progress_pct ?? 0);
              const done = !!e.completed_at || pct >= 100;
              const hasCert = certIds.has(e.course_id);
              return (
                <Card key={e.id} className="flex h-full flex-col overflow-hidden p-0">
                  <Link href={`/app/cursos/${course?.slug}`} className="block">
                    <div className="relative aspect-video bg-surface-alt">
                      {course?.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-cream/20">
                          <PlayCircle size={40} />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    {course?.category && <p className="mb-1 text-xs uppercase tracking-wide text-gold/70">{course.category}</p>}
                    <Link href={`/app/cursos/${course?.slug}`} className="font-medium text-cream hover:text-gold">
                      {course?.title}
                    </Link>
                    <div className="mt-4">
                      <Progress value={pct} />
                      <p className="mt-1.5 text-xs text-cream/50">{pct.toFixed(0)}% concluído</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <LinkButton href={`/app/cursos/${course?.slug}`} variant={done ? 'outline' : 'gold'} className="flex-1">
                        {done ? 'Revisar' : 'Continuar'}
                      </LinkButton>
                      {hasCert && (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/40 px-3 py-2.5 text-xs text-emerald-400">
                          <Award size={14} /> Certificado
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Você ainda não está matriculado"
            description="Explore os cursos disponíveis abaixo e comece a estudar."
          />
        )}
      </section>

      {/* Explorar */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-serif text-xl text-cream">
          <Compass size={20} className="text-gold" /> Explorar cursos
        </h2>
        {explore.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {explore.map((c: any) => (
              <Card key={c.id} className="flex h-full flex-col overflow-hidden p-0">
                <Link href={`/app/cursos/${c.slug}`} className="block">
                  <div className="relative aspect-video bg-surface-alt">
                    {c.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-cream/20">
                        <PlayCircle size={40} />
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      {c.is_free ? <Badge tone="success">Gratuito</Badge> : <Badge tone="gold"><Lock size={11} className="mr-1" /> Assinantes</Badge>}
                    </div>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  {c.category && <p className="mb-1 text-xs uppercase tracking-wide text-gold/70">{c.category}</p>}
                  <Link href={`/app/cursos/${c.slug}`} className="font-medium text-cream hover:text-gold">{c.title}</Link>
                  {c.subtitle && <p className="mt-1 line-clamp-2 text-sm text-cream/55">{c.subtitle}</p>}
                  <div className="mt-4">
                    <LinkButton href={`/app/cursos/${c.slug}`} variant="outline" className="w-full">Ver curso</LinkButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="Nada por aqui" description="Você já está matriculado em todos os cursos publicados." />
        )}
      </section>
    </div>
  );
}
