import Link from 'next/link';
import {
  ArrowRight, Download, Newspaper, MessagesSquare, BookOpen, Video, Bot,
  CalendarDays, Wrench, BellRing, PlayCircle, Globe, Lock, GraduationCap,
} from 'lucide-react';
import { LinkButton, SectionTitle, Card, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

/** Níveis de acesso exibidos na matriz da home. */
const ACESSO = {
  publico: { label: 'Público', icon: Globe, tone: 'success' as const },
  membros: { label: 'Membros e Alunos', icon: Lock, tone: 'gold' as const },
  alunos: { label: 'Alunos', icon: GraduationCap, tone: 'gold' as const },
};

const RECURSOS = [
  {
    icon: Download, acesso: 'publico' as const,
    titulo: 'Baixar Guias Estratégicos',
    desc: 'Materiais práticos sobre negociações coletivas, desenvolvidos por quem atua há mais de 30 anos na área.',
  },
  {
    icon: Newspaper, acesso: 'publico' as const,
    titulo: 'Atualizações',
    desc: 'Notícias, decisões judiciais, mudanças legislativas e tendências comentadas.',
  },
  {
    icon: CalendarDays, acesso: 'publico' as const,
    titulo: 'Eventos',
    desc: 'Lives, webinars, encontros e sessões abertas com especialistas.',
  },
  {
    icon: MessagesSquare, acesso: 'membros' as const,
    titulo: 'Hub de Inteligência',
    desc: 'Comunidade para acompanhar tendências, discutir casos práticos e trocar experiências sobre negociações coletivas, relações sindicais e governança trabalhista.',
  },
  {
    icon: BookOpen, acesso: 'membros' as const,
    titulo: 'Biblioteca',
    desc: 'Modelos, checklists, e-books, guias, cláusulas comentadas e materiais de apoio.',
  },
  {
    icon: Bot, acesso: 'membros' as const,
    titulo: 'Assistente de IA',
    desc: 'IA especializada em negociações sindicais para consultas, pesquisas e apoio técnico.',
  },
  {
    icon: Wrench, acesso: 'membros' as const,
    titulo: 'Ferramentas',
    desc: 'Calculadoras, simuladores, matrizes de negociação, cronogramas e recursos práticos.',
  },
  {
    icon: BellRing, acesso: 'membros' as const,
    titulo: 'Alertas Inteligentes',
    desc: 'Avisos sobre publicação de convenções coletivas, decisões relevantes e mudanças legislativas que impactam negociações.',
  },
  {
    icon: Video, acesso: 'alunos' as const,
    titulo: 'Cursos e Mentorias',
    desc: 'Cursos, mentorias e treinamentos especializados.',
  },
];

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: courses }, { data: plans }, { data: media }] = await Promise.all([
    supabase.from('courses').select('*').eq('published', true).order('sort_order').limit(6),
    supabase.from('plans').select('*').eq('active', true).order('sort_order'),
    supabase.from('site_settings').select('value').eq('key', 'home_media').maybeSingle(),
  ]);

  const homeMedia = (media?.value ?? {}) as { type?: string; url?: string; caption?: string };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.16),transparent_65%)]" />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <Badge tone="gold">IRTS</Badge>
          <h1 className="mx-auto mt-6 max-w-4xl font-serif text-5xl leading-tight text-cream md:text-6xl">
            O Centro de <span className="gold-text">Inteligência</span> em Relações Trabalhistas e Sindicais
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-cream/60">
            Domine as negociações, antecipe riscos e tome decisões com inteligência.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/cadastro" variant="gold">Comece agora <ArrowRight size={16} /></LinkButton>
            <LinkButton href="/cursos" variant="outline">Ver cursos</LinkButton>
          </div>
        </div>
      </section>

      {/* INSTITUCIONAL — imagem ou vídeo sobre o IRTS */}
      <section className="mx-auto max-w-5xl px-4 pb-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {homeMedia.url && homeMedia.type === 'video' ? (
            <div className="aspect-video w-full">
              <iframe
                src={homeMedia.url}
                title="Sobre o IRTS"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : homeMedia.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={homeMedia.url} alt="Sobre o IRTS" className="w-full object-cover" />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-surface-alt text-center">
              <PlayCircle size={44} className="text-gold/60" />
              <p className="font-serif text-xl text-cream">Conheça o IRTS</p>
              <p className="max-w-md px-6 text-sm text-cream/50">
                Espaço reservado para a imagem ou o vídeo institucional. Envie o arquivo/link
                e ele aparece aqui.
              </p>
            </div>
          )}
          {homeMedia.caption && (
            <p className="border-t border-line px-5 py-3 text-center text-sm text-cream/60">{homeMedia.caption}</p>
          )}
        </div>
      </section>

      {/* MATRIZ DE ACESSO */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionTitle
          center
          overline="A plataforma"
          title="O que é aberto e o que é exclusivo"
          subtitle="Parte do conteúdo é livre para todos. O acervo estratégico, as ferramentas e a inteligência aplicada são exclusivos de membros e alunos."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => {
            const acesso = ACESSO[r.acesso];
            return (
              <Card key={r.titulo} className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <r.icon className="text-gold" size={26} />
                  <Badge tone={acesso.tone}>{acesso.label}</Badge>
                </div>
                <h3 className="mt-4 font-serif text-xl text-cream">{r.titulo}</h3>
                <p className="mt-2 text-sm text-cream/55">{r.desc}</p>
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-cream/50">
          Acesso de <strong className="text-cream/70">Membros e Alunos</strong> por plano mensal ou anual ·
          Alunos mantêm o acesso ao Hub por 6 meses após a compra do curso.
        </p>
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
                      : <div className="flex h-full w-full items-center justify-center bg-gold/10 font-serif text-3xl text-gold/50">IRTS</div>}
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
        <div className="section-navy relative overflow-hidden rounded-2xl p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.18),transparent_60%)]" />
          <h2 className="relative font-serif text-4xl text-white">Pronto para decidir com inteligência?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/70">
            Crie sua conta e tenha acesso imediato aos guias estratégicos, às atualizações e aos eventos abertos.
          </p>
          <div className="relative mt-8"><LinkButton href="/cadastro" variant="gold">Criar minha conta <ArrowRight size={16} /></LinkButton></div>
        </div>
      </section>
    </>
  );
}
