import { ShieldCheck, Target, BookOpen } from 'lucide-react';
import { Badge, SectionTitle, Card, LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Sobre' };

export default async function SobrePage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['bio', 'brand']);

  const map = new Map((settings ?? []).map((s: any) => [s.key, s.value]));
  const bio: any = map.get('bio') ?? {};
  const brand: any = map.get('brand') ?? {};

  const headline: string = bio.headline || 'Sobre o IRTS';
  const rawBody: string = bio.body || '';
  const isPlaceholder = /PENDENTE/i.test(rawBody) || !rawBody;
  const body = isPlaceholder
    ? 'Biografia oficial em atualização. Em breve, a trajetória completa e as credenciais do fundador do IRTS.'
    : rawBody;
  const photo: string = bio.photo_url || '';

  return (
    <>
      {/* HERO / BIO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.12),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2">
          <div>
            <Badge tone="gold">{brand.full_name || 'Inteligência em Relações Trabalhistas e Sindicais'}</Badge>
            <h1 className="mt-6 font-serif text-4xl leading-tight text-cream md:text-5xl">{headline}</h1>
            <p className="mt-6 whitespace-pre-line text-lg text-cream/60">{body}</p>
            {isPlaceholder && (
              <p className="mt-4 text-sm italic text-cream/40">
                Conteúdo provisório — a biografia definitiva será publicada em breve.
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/cursos" variant="gold">Ver cursos</LinkButton>
              <LinkButton href="/contato" variant="outline">Falar com o IRTS</LinkButton>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface-alt">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={headline} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cream/20">
                  <span className="font-serif text-6xl text-gold/30">IRTS</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MISSÃO */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionTitle center overline="Nossa missão" title="Por que o IRTS existe" subtitle="Elevar o nível técnico de quem atua em relações trabalhistas e sindicais — com formação aplicada, conteúdo confiável e tecnologia." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Target, t: 'Formação aplicada', d: 'Cursos e mentorias voltados à prática real de negociação, compliance e gestão sindical.' },
            { icon: BookOpen, t: 'Conhecimento confiável', d: 'Biblioteca técnica com ACTs, CCTs, modelos e jurisprudência comentada, sempre atualizada.' },
            { icon: ShieldCheck, t: 'Tecnologia a serviço', d: 'Consultor IA treinado no conteúdo do IRTS para apoiar decisões com segurança.' },
          ].map((f) => (
            <Card key={f.t}>
              <f.icon className="text-gold" size={28} />
              <h3 className="mt-4 font-serif text-xl text-cream">{f.t}</h3>
              <p className="mt-2 text-sm text-cream/55">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="card relative overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.14),transparent_60%)]" />
          <h2 className="relative font-serif text-4xl text-cream">Faça parte do IRTS</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-cream/60">
            Junte-se a profissionais e sindicatos que evoluem com conteúdo de excelência.
          </p>
          <div className="relative mt-8"><LinkButton href="/cadastro" variant="gold">Criar minha conta</LinkButton></div>
        </div>
      </section>
    </>
  );
}
