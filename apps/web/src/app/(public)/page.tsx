import Link from 'next/link';
import { ArrowRight, BookOpen, Bot, Calendar, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { LinkButton, SectionTitle, Card, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: courses }, { data: plans }] = await Promise.all([
    supabase.from('courses').select('*').eq('published', true).order('sort_order').limit(6),
    supabase.from('plans').select('*').eq('active', true).order('sort_order'),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.12),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <Badge tone="gold">Inteligência em Relações Trabalhistas e Sindicais</Badge>
          <h1 className="mx-auto mt-6 max-w-4xl font-serif text-5xl leading-tight text-cream md:text-6xl">
            Domine as <span className="gold-text">relações trabalhistas</span> e sindicais
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-cream/60">
            Cursos aplicados, biblioteca técnica (ACTs, CCTs, modelos e jurisprudência), mentorias
            e um Consultor IA treinado no conteúdo do IRTS.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/cadastro" variant="gold">Comece agora <ArrowRight size={16} /></LinkButton>
            <LinkButton href="/cursos" variant="outline">Ver cursos</LinkButton>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionTitle center overline="A plataforma" title="Tudo em um só lugar" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: GraduationCap, t: 'Cursos gravados', d: 'Trilhas com progresso, continuar assistindo e certificados.' },
            { icon: BookOpen, t: 'Biblioteca técnica', d: 'E-books, modelos, checklists, ACTs, CCTs e jurisprudência comentada.' },
            { icon: Bot, t: 'Consultor IA', d: 'Respostas baseadas exclusivamente no conteúdo da plataforma.' },
            { icon: Calendar, t: 'Agenda', d: 'Mentorias, lives, eventos e webinars num só calendário.' },
            { icon: Users, t: 'Comunidade', d: 'Fórum, perguntas e networking entre profissionais.' },
            { icon: ShieldCheck, t: 'Acesso por plano', d: 'Assinatura mensal ou anual com liberação automática.' },
          ].map((f) => (
            <Card key={f.t}>
              <f.icon className="text-gold" size={28} />
              <h3 className="mt-4 font-serif text-xl text-cream">{f.t}</h3>
              <p className="mt-2 text-sm text-cream/55">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CURSOS EM DESTAQUE */}
      {courses && courses.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex items-end justify-between">
            <SectionTitle overline="Aprenda" title="Cursos em destaque" />
            <Link href="/cursos" className="hidden text-sm text-gold hover:underline sm:block">Ver todos →</Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} href={`/cursos/${c.slug}`}>
                <Card className="h-full transition hover:border-gold/50">
                  <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-surface-alt">
                    {c.cover_url
                      ? <img src={c.cover_url} alt={c.title} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center bg-gold-gradient/10 font-serif text-3xl text-gold/40">IRTS</div>}
                  </div>
                  {c.category && <Badge tone="gold">{c.category}</Badge>}
                  <h3 className="mt-3 font-serif text-xl text-cream">{c.title}</h3>
                  {c.subtitle && <p className="mt-1 text-sm text-cream/55">{c.subtitle}</p>}
                  <p className="mt-4 text-sm font-semibold text-gold">
                    {c.is_free ? 'Gratuito' : c.price_cents ? formatBRL(c.price_cents) : 'Incluso no plano'}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PLANOS */}
      {plans && plans.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <SectionTitle center overline="Assinatura" title="Escolha seu plano" subtitle="Comece grátis e evolua para o acesso completo quando quiser." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.id} className={p.highlight ? 'border-gold shadow-gold' : ''}>
                {p.highlight && <Badge tone="gold">Mais popular</Badge>}
                <h3 className="mt-3 font-serif text-2xl text-cream">{p.name}</h3>
                <p className="mt-2 text-3xl font-semibold text-gold">
                  {p.price_cents === 0 ? 'Grátis' : formatBRL(p.price_cents)}
                  <span className="text-sm text-cream/40">{p.interval === 'month' ? '/mês' : p.interval === 'year' ? '/ano' : ''}</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-cream/60">
                  {(p.features as string[]).map((f) => <li key={f}>• {f}</li>)}
                </ul>
                <LinkButton href="/cadastro" variant={p.highlight ? 'gold' : 'outline'} className="mt-6 w-full">
                  {p.price_cents === 0 ? 'Criar conta' : 'Assinar'}
                </LinkButton>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="card relative overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.14),transparent_60%)]" />
          <h2 className="relative font-serif text-4xl text-cream">Pronto para começar?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-cream/60">
            Crie sua conta e tenha acesso imediato às amostras, à comunidade e ao conteúdo aberto.
          </p>
          <div className="relative mt-8"><LinkButton href="/cadastro" variant="gold">Criar minha conta <ArrowRight size={16} /></LinkButton></div>
        </div>
      </section>
    </>
  );
}
