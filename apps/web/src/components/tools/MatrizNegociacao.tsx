'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';

type Posicao = 'ceder' | 'negociar' | 'segurar';

type Linha = {
  id: string;
  clausula: string;
  impacto: number; // 1-5 (custo/impacto financeiro para a empresa)
  relevancia: number; // 1-5 (relevância para a categoria)
  posicao: Posicao;
};

const POSICOES: { value: Posicao; label: string }[] = [
  { value: 'ceder', label: 'Ceder' },
  { value: 'negociar', label: 'Negociar' },
  { value: 'segurar', label: 'Segurar' },
];

const ESCALA = [1, 2, 3, 4, 5];

let seq = 0;
const nextId = () => `mn-${++seq}-${Math.random().toString(36).slice(2, 7)}`;

const INICIAIS: Linha[] = [
  { id: 'mn-0-a', clausula: 'Reajuste salarial', impacto: 5, relevancia: 5, posicao: 'segurar' },
  { id: 'mn-0-b', clausula: 'Estabilidade pré-aposentadoria', impacto: 2, relevancia: 5, posicao: 'segurar' },
  { id: 'mn-0-c', clausula: 'Vale-alimentação', impacto: 4, relevancia: 4, posicao: 'negociar' },
  { id: 'mn-0-d', clausula: 'Banco de horas', impacto: 4, relevancia: 2, posicao: 'ceder' },
];

/** Sugestão automática a partir do score (relevância − impacto). */
function sugestao(score: number): { label: string; tone: 'gold' | 'success' | 'warning' | 'default'; detalhe: string } {
  if (score >= 2) {
    return {
      label: 'Moeda de troca',
      tone: 'success',
      detalhe: 'Alta relevância e baixo custo: peça cedo e sustente — é barato para a empresa e vale muito para a categoria.',
    };
  }
  if (score <= -2) {
    return {
      label: 'Ceder',
      tone: 'warning',
      detalhe: 'Custo alto e relevância baixa: candidata natural a ser cedida em troca de outra cláusula.',
    };
  }
  return {
    label: 'Negociar',
    tone: 'gold',
    detalhe: 'Custo e relevância equilibrados: ponto de barganha, trabalhe com contrapartidas.',
  };
}

const POSICAO_LABEL: Record<Posicao, string> = {
  ceder: 'Ceder',
  negociar: 'Negociar',
  segurar: 'Segurar',
};

export function MatrizNegociacao() {
  const [linhas, setLinhas] = useState<Linha[]>(INICIAIS);

  function addLinha() {
    setLinhas((prev) => [
      ...prev,
      { id: nextId(), clausula: '', impacto: 3, relevancia: 3, posicao: 'negociar' },
    ]);
  }
  function removeLinha(id: string) {
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  }
  function update(id: string, patch: Partial<Linha>) {
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  const ordenadas = useMemo(() => {
    return linhas
      .map((l, idx) => ({ ...l, idx, score: l.relevancia - l.impacto }))
      .sort((a, b) => (b.score - a.score) || (b.relevancia - a.relevancia) || (a.idx - b.idx));
  }, [linhas]);

  const resumo = useMemo(() => {
    let troca = 0;
    let negociar = 0;
    let ceder = 0;
    for (const l of ordenadas) {
      if (l.score >= 2) troca++;
      else if (l.score <= -2) ceder++;
      else negociar++;
    }
    return { troca, negociar, ceder, total: ordenadas.length };
  }, [ordenadas]);

  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-serif text-lg text-cream">Cláusulas em disputa</p>
            <p className="text-sm text-cream/50">
              Impacto = custo financeiro para a empresa (1 a 5). Relevância = importância para a
              categoria (1 a 5).
            </p>
          </div>
          <Button variant="outline" type="button" onClick={addLinha}>
            <Plus size={16} /> Adicionar cláusula
          </Button>
        </div>

        {linhas.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface-alt p-6 text-center text-sm text-cream/50">
            Nenhuma cláusula na matriz. Clique em “Adicionar cláusula” para começar.
          </p>
        ) : (
          <div className="space-y-3">
            {linhas.map((l, idx) => (
              <div
                key={l.id}
                className="grid items-end gap-3 rounded-xl border border-line bg-surface-alt p-3 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]"
              >
                <div>
                  <label className="label">Cláusula</label>
                  <input
                    className="input"
                    value={l.clausula}
                    placeholder={`Cláusula ${idx + 1}`}
                    onChange={(e) => update(l.id, { clausula: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Impacto (1-5)</label>
                  <select
                    className="input"
                    value={l.impacto}
                    onChange={(e) => update(l.id, { impacto: Number(e.target.value) })}
                  >
                    {ESCALA.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Relevância (1-5)</label>
                  <select
                    className="input"
                    value={l.relevancia}
                    onChange={(e) => update(l.id, { relevancia: Number(e.target.value) })}
                  >
                    {ESCALA.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Posição</label>
                  <select
                    className="input"
                    value={l.posicao}
                    onChange={(e) => update(l.id, { posicao: e.target.value as Posicao })}
                  >
                    {POSICOES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLinha(l.id)}
                    aria-label="Remover cláusula"
                    title="Remover cláusula"
                    className="rounded-lg border border-line p-2 text-cream/50 transition hover:border-gold/40 hover:text-gold"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {ordenadas.length > 0 && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-serif text-lg text-cream">Prioridade sugerida</p>
              <p className="text-sm text-cream/50">
                Ordenado por score (relevância − impacto): do que mais compensa sustentar ao que
                mais compensa ceder.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">{resumo.troca} moeda(s) de troca</Badge>
              <Badge tone="gold">{resumo.negociar} a negociar</Badge>
              <Badge tone="warning">{resumo.ceder} a ceder</Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.12em] text-cream/50">
                  <th className="py-2 pr-3 font-normal">#</th>
                  <th className="py-2 pr-3 font-normal">Cláusula</th>
                  <th className="py-2 pr-3 text-center font-normal">Impacto</th>
                  <th className="py-2 pr-3 text-center font-normal">Relevância</th>
                  <th className="py-2 pr-3 text-center font-normal">Score</th>
                  <th className="py-2 pr-3 font-normal">Posição</th>
                  <th className="py-2 font-normal">Sugestão</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((l, i) => {
                  const s = sugestao(l.score);
                  return (
                    <tr key={l.id} className="border-b border-line last:border-0 align-top">
                      <td className="py-3 pr-3 tabular-nums text-cream/40">{i + 1}</td>
                      <td className="py-3 pr-3 text-cream">
                        {l.clausula || `Cláusula ${l.idx + 1}`}
                        <p className="mt-0.5 max-w-sm text-xs text-cream/40">{s.detalhe}</p>
                      </td>
                      <td className="py-3 pr-3 text-center tabular-nums text-cream/70">{l.impacto}</td>
                      <td className="py-3 pr-3 text-center tabular-nums text-cream/70">{l.relevancia}</td>
                      <td className="py-3 pr-3 text-center tabular-nums text-cream">
                        {l.score > 0 ? `+${l.score}` : l.score}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="chip">{POSICAO_LABEL[l.posicao]}</span>
                      </td>
                      <td className="py-3">
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface-alt p-4">
              <Badge tone="success">Score ≥ +2</Badge>
              <p className="mt-2 text-sm text-cream/60">
                Moeda de troca: relevância alta e custo baixo. Entre na mesa com essas cláusulas na
                frente.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface-alt p-4">
              <Badge tone="gold">Score entre −1 e +1</Badge>
              <p className="mt-2 text-sm text-cream/60">
                Zona de barganha: só avance com contrapartida explícita.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface-alt p-4">
              <Badge tone="warning">Score ≤ −2</Badge>
              <p className="mt-2 text-sm text-cream/60">
                Custo alto e relevância baixa: use como concessão para destravar o que importa.
              </p>
            </div>
          </div>
        </Card>
      )}

      <p className="text-xs text-cream/40">
        A matriz é um apoio à decisão. A posição final depende do mandato da assembleia e da
        conjuntura da categoria.
      </p>
    </div>
  );
}
