import Link from 'next/link';
import {
  Wrench,
  Calculator,
  LineChart,
  LayoutGrid,
  CalendarClock,
  Table2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui';

export const metadata = { title: 'Ferramentas' };

type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: string;
  route: string | null;
  url: string | null;
};

/** Fallback: as 5 calculadoras nativas, caso a tabela `tools` ainda não exista/esteja vazia. */
const NATIVE_TOOLS: Tool[] = [
  {
    id: 'reajuste',
    slug: 'reajuste',
    name: 'Calculadora de reajuste salarial',
    description:
      'Calcule o reajuste com base em índice (INPC/IPCA) e ganho real, e veja o impacto na folha.',
    kind: 'calculadora',
    route: '/app/ferramentas/reajuste',
    url: null,
  },
  {
    id: 'impacto',
    slug: 'impacto',
    name: 'Simulador de impacto financeiro',
    description:
      'Projete o custo mensal e anual de uma proposta somando cláusulas econômicas e encargos.',
    kind: 'simulador',
    route: '/app/ferramentas/impacto',
    url: null,
  },
  {
    id: 'banco-de-horas',
    slug: 'banco-de-horas',
    name: 'Calculadora de banco de horas',
    description: 'Saldo de horas, prazo de compensação e custo caso o saldo vire hora extra.',
    kind: 'calculadora',
    route: '/app/ferramentas/banco-de-horas',
    url: null,
  },
  {
    id: 'matriz',
    slug: 'matriz',
    name: 'Matriz de negociação',
    description:
      'Priorize cláusulas por impacto financeiro x relevância sindical e defina sua zona de acordo.',
    kind: 'matriz',
    route: '/app/ferramentas/matriz',
    url: null,
  },
  {
    id: 'cronograma',
    slug: 'cronograma',
    name: 'Cronograma da data-base',
    description: 'Marcos e contagem regressiva da negociação a partir da data-base da categoria.',
    kind: 'cronograma',
    route: '/app/ferramentas/cronograma',
    url: null,
  },
];

const KIND_LABELS: Record<string, string> = {
  calculadora: 'Calculadora',
  simulador: 'Simulador',
  matriz: 'Matriz',
  cronograma: 'Cronograma',
  planilha: 'Planilha',
};

const KIND_ICONS: Record<string, typeof Calculator> = {
  calculadora: Calculator,
  simulador: LineChart,
  matriz: LayoutGrid,
  cronograma: CalendarClock,
  planilha: Table2,
};

export default async function FerramentasPage() {
  let tools: Tool[] = [];

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('tools')
      .select('id, name, slug, description, kind, route, url')
      .eq('published', true)
      .order('sort_order', { ascending: true });
    if (data) tools = data as Tool[];
  } catch {
    // Migration ainda não aplicada — segue com o fallback abaixo.
  }

  // Nunca deixa a página vazia: cai para as ferramentas nativas.
  const list = tools.length > 0 ? tools : NATIVE_TOOLS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-cream">
          <Wrench size={26} className="text-gold" /> Ferramentas
        </h1>
        <p className="mt-1 text-cream/50">
          Calculadoras e simuladores para preparar, sustentar e fechar a negociação coletiva.
        </p>
      </div>

      {list.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tool) => {
            const Icon = KIND_ICONS[tool.kind] ?? Wrench;
            const href = tool.route ?? tool.url ?? null;
            const isExternal = !tool.route && !!tool.url;

            const body = (
              <Card className="flex h-full flex-col transition hover:border-gold/40">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-alt">
                    <Icon size={18} className="text-gold" />
                  </span>
                  <Badge tone="gold">{KIND_LABELS[tool.kind] ?? tool.kind}</Badge>
                </div>

                <p className="font-medium text-cream">{tool.name}</p>
                {tool.description && (
                  <p className="mt-1.5 text-sm text-cream/55">{tool.description}</p>
                )}

                <div className="mt-4 flex-1" />

                <span className="inline-flex items-center gap-1.5 text-sm text-gold">
                  {isExternal ? (
                    <>
                      Abrir recurso <ExternalLink size={15} />
                    </>
                  ) : (
                    <>
                      Abrir ferramenta <ArrowRight size={15} />
                    </>
                  )}
                </span>
              </Card>
            );

            if (!href) {
              return <div key={tool.id}>{body}</div>;
            }

            return isExternal ? (
              <a
                key={tool.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                {body}
              </a>
            ) : (
              <Link key={tool.id} href={href} className="block h-full">
                {body}
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma ferramenta disponível"
          description="As calculadoras e simuladores aparecerão aqui em breve."
        />
      )}
    </div>
  );
}
