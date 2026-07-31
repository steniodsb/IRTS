import { Award, ShieldCheck, Target, Scale, Sparkles, ArrowRight, UserRound } from 'lucide-react';
import { Badge, SectionTitle, Card, LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Sobre' };

/** Normaliza `bio.body`: aceita array de parágrafos OU string (split por linha em branco). */
function toParagraphs(body: unknown): string[] {
  if (Array.isArray(body)) return body.map((p) => String(p)).filter(Boolean);
  if (typeof body === 'string') {
    return body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p && !/PENDENTE/i.test(p));
  }
  return [];
}

export default async function SobrePage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['bio', 'brand']);

  const map = new Map((settings ?? []).map((s: any) => [s.key, s.value]));
  const bio: any = map.get('bio') ?? {};
  const brand: any = map.get('brand') ?? {};

  const name: string = bio.name || 'Newton dos Anjos';
  const tagline: string = bio.tagline || '';
  const photo: string = bio.photo_url || '';
  const paragraphs = toParagraphs(bio.body);
  const credenciais: { titulo?: string; texto?: string }[] = Array.isArray(bio.credenciais)
    ? bio.credenciais
    : [];

  return (
    <>
      {/* 1) POR QUE O IRTS EXISTE — missão institucional */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-4">
        <div className="section-navy relative overflow-hidden rounded-2xl p-10 md:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,162,39,0.2),transparent_60%)]" />
          <div className="relative max-w-3xl">
            <Badge tone="gold">{brand.full_name || 'IRTS'}</Badge>
            <h1 className="mt-6 font-serif text-4xl leading-tight text-white md:text-5xl">
              Por que o IRTS existe
            </h1>
            <div className="mt-6 space-y-4 text-lg text-white/70">
              <p>
                As relações trabalhistas e sindicais mudam rápido — e quem decide sem informação
                paga caro por isso. O IRTS existe para transformar esse cenário em algo gerenciável:
                antecipar riscos antes que eles cheguem à mesa de negociação e dar a cada decisão o
                respaldo técnico que ela merece.
              </p>
              <p>
                Reunimos formação aplicada, um acervo estratégico sempre atualizado e inteligência
                artificial treinada no tema, para que negociações coletivas, compliance e governança
                trabalhista deixem de ser reação ao imprevisto e passem a ser processo conduzido com
                método.
              </p>
              <p>
                Nosso compromisso é elevar o nível de quem atua na área — sindicatos, empresas e
                profissionais — para que cada escolha seja tomada com inteligência, e não no escuro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2) SOBRE NEWTON DOS ANJOS — destaque, 2 colunas */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionTitle overline="Quem lidera" title={`Sobre ${name}`} />

        <div className="mt-10 grid items-start gap-10 md:grid-cols-[2fr_3fr]">
          {/* Foto */}
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface-alt">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={name} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
                  <UserRound size={44} className="text-gold/40" />
                  <p className="font-serif text-xl text-cream">Foto em breve</p>
                  <p className="max-w-[16rem] px-6 text-sm text-cream/50">
                    A imagem oficial será publicada em breve.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Texto */}
          <div>
            <h3 className="font-serif text-3xl text-cream md:text-4xl">{name}</h3>
            {tagline && <p className="mt-3 text-lg font-medium text-gold">{tagline}</p>}
            {paragraphs.length > 0 ? (
              <div className="mt-6 space-y-4 text-cream/70">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : (
              <p className="mt-6 italic text-cream/50">
                Biografia oficial em atualização. Em breve, a trajetória completa e as credenciais
                do fundador do IRTS.
              </p>
            )}
          </div>
        </div>

        {/* Credenciais */}
        {credenciais.length > 0 && (
          <div className="mt-12">
            <p className="mb-5 text-xs uppercase tracking-[0.2em] text-gold">Credenciais</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {credenciais.map((c, i) => (
                <Card key={i} className="flex h-full flex-col">
                  <Award className="text-gold" size={26} />
                  {c.titulo && <h4 className="mt-4 font-serif text-lg text-cream">{c.titulo}</h4>}
                  {c.texto && <p className="mt-2 text-sm text-cream/55">{c.texto}</p>}
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3) CONHEÇA O IRTS — CTA final */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="card relative overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.14),transparent_60%)]" />
          <div className="relative">
            <div className="mx-auto mb-5 flex flex-wrap items-center justify-center gap-2 text-gold">
              <Scale size={20} />
              <Target size={20} />
              <ShieldCheck size={20} />
              <Sparkles size={20} />
            </div>
            <h2 className="font-serif text-4xl text-cream">Conheça o IRTS</h2>
            <p className="mx-auto mt-3 max-w-xl text-cream/60">
              Formação aplicada, acervo estratégico e inteligência a serviço de quem atua em
              relações trabalhistas e sindicais.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <LinkButton href="/cursos" variant="gold">
                Ver cursos <ArrowRight size={16} />
              </LinkButton>
              <LinkButton href="/cadastro" variant="outline">
                Criar minha conta
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
