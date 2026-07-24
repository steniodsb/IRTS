'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { NumberField, ResultRow, BigStat } from './fields';
import { brl, pctFmt, safeDiv, toNum } from './format';

type ClausulaTipo = 'percentual' | 'fixo';

type Clausula = {
  id: string;
  nome: string;
  tipo: ClausulaTipo;
  valor: string;
};

let seq = 0;
const nextId = () => `cl-${++seq}-${Math.random().toString(36).slice(2, 7)}`;

const INICIAIS: Clausula[] = [
  { id: 'cl-0-inicial', nome: 'Reajuste salarial', tipo: 'percentual', valor: '6.5' },
  { id: 'cl-0-vale', nome: 'Vale-alimentação', tipo: 'fixo', valor: '250' },
];

export function SimuladorImpacto() {
  const [massa, setMassa] = useState('500000');
  const [empregados, setEmpregados] = useState('120');
  const [encargos, setEncargos] = useState('70');
  const [clausulas, setClausulas] = useState<Clausula[]>(INICIAIS);

  function addClausula() {
    setClausulas((prev) => [...prev, { id: nextId(), nome: '', tipo: 'percentual', valor: '' }]);
  }
  function removeClausula(id: string) {
    setClausulas((prev) => prev.filter((c) => c.id !== id));
  }
  function updateClausula(id: string, patch: Partial<Clausula>) {
    setClausulas((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  const r = useMemo(() => {
    const folha = Math.max(0, toNum(massa));
    const qtd = Math.max(0, Math.floor(toNum(empregados)));
    const enc = Math.max(0, toNum(encargos)) / 100;

    const linhas = clausulas.map((c) => {
      const v = toNum(c.valor);
      // Percentual incide sobre a folha; valor fixo é por empregado/mês.
      const custoMensal = c.tipo === 'percentual' ? folha * (v / 100) : v * qtd;
      return {
        ...c,
        custoMensal,
        custoAnual: custoMensal * 13,
        pctFolha: safeDiv(custoMensal, folha) * 100,
      };
    });

    const mensal = linhas.reduce((s, l) => s + l.custoMensal, 0);
    const mensalEnc = mensal * (1 + enc);

    return {
      folha,
      qtd,
      encPct: enc * 100,
      linhas,
      mensal,
      anual: mensal * 13,
      mensalEnc,
      anualEnc: mensalEnc * 13,
      pctFolha: safeDiv(mensal, folha) * 100,
      pctFolhaEnc: safeDiv(mensalEnc, folha) * 100,
      porEmpregadoMes: safeDiv(mensal, qtd),
      porEmpregadoAno: safeDiv(mensal, qtd) * 13,
    };
  }, [massa, empregados, encargos, clausulas]);

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------ Base de cálculo */}
      <Card>
        <p className="mb-4 font-serif text-lg text-cream">Base de cálculo</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Massa salarial mensal (R$)"
            value={massa}
            onChange={setMassa}
            hint="Salários, sem encargos."
            placeholder="0,00"
          />
          <NumberField
            label="Número de empregados"
            value={empregados}
            onChange={setEmpregados}
            step={1}
            placeholder="0"
          />
          <NumberField
            label="Encargos (%)"
            value={encargos}
            onChange={setEncargos}
            hint="Padrão 70%."
            placeholder="70"
          />
        </div>
      </Card>

      {/* ------------------------------------------------ Cláusulas */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-serif text-lg text-cream">Cláusulas econômicas</p>
            <p className="text-sm text-cream/50">
              Percentual incide sobre a folha; valor fixo é por empregado/mês.
            </p>
          </div>
          <Button variant="outline" type="button" onClick={addClausula}>
            <Plus size={16} /> Adicionar cláusula
          </Button>
        </div>

        {r.linhas.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface-alt p-6 text-center text-sm text-cream/50">
            Nenhuma cláusula na proposta. Clique em “Adicionar cláusula” para começar.
          </p>
        ) : (
          <div className="space-y-3">
            {r.linhas.map((l, idx) => (
              <div
                key={l.id}
                className="grid items-end gap-3 rounded-xl border border-line bg-surface-alt p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto]"
              >
                <div>
                  <label className="label">Cláusula</label>
                  <input
                    className="input"
                    value={l.nome}
                    placeholder={`Cláusula ${idx + 1}`}
                    onChange={(e) => updateClausula(l.id, { nome: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Tipo</label>
                  <select
                    className="input"
                    value={l.tipo}
                    onChange={(e) =>
                      updateClausula(l.id, { tipo: e.target.value as ClausulaTipo })
                    }
                  >
                    <option value="percentual">% sobre a folha</option>
                    <option value="fixo">R$ fixo por empregado/mês</option>
                  </select>
                </div>

                <div>
                  <label className="label">{l.tipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input"
                    value={l.valor}
                    min={0}
                    step="any"
                    placeholder="0,00"
                    onChange={(e) => updateClausula(l.id, { valor: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-end">
                  <p className="text-sm text-cream tabular-nums md:mb-2">{brl(l.custoMensal)}</p>
                  <button
                    type="button"
                    onClick={() => removeClausula(l.id)}
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

      {/* ------------------------------------------------ Resultado */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-serif text-lg text-cream">Impacto da proposta</p>
          <Badge tone="gold">{r.linhas.length} cláusula(s)</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <BigStat label="Custo mensal adicional" value={brl(r.mensal)} hint="Sem encargos." />
          <BigStat label="Custo anual (13 meses)" value={brl(r.anual)} hint="Inclui o 13º." />
          <BigStat
            label="% sobre a folha"
            value={r.folha > 0 ? pctFmt(r.pctFolha) : '—'}
            hint={r.folha > 0 ? undefined : 'Informe a massa salarial.'}
          />
        </div>

        <div className="mt-4">
          <ResultRow label="Custo mensal adicional" value={brl(r.mensal)} />
          <ResultRow
            label={`Custo mensal com encargos (${pctFmt(r.encPct, 0)})`}
            value={brl(r.mensalEnc)}
            strong
          />
          <ResultRow label="Custo anual com encargos (13 meses)" value={brl(r.anualEnc)} />
          <ResultRow
            label="% sobre a folha com encargos"
            value={r.folha > 0 ? pctFmt(r.pctFolhaEnc) : '—'}
          />
          <ResultRow
            label="Custo por empregado / mês"
            value={r.qtd > 0 ? brl(r.porEmpregadoMes) : '—'}
          />
          <ResultRow
            label="Custo por empregado / ano (13 meses)"
            value={r.qtd > 0 ? brl(r.porEmpregadoAno) : '—'}
          />
        </div>
      </Card>

      {r.linhas.length > 0 && (
        <Card>
          <p className="mb-3 font-serif text-lg text-cream">Detalhamento por cláusula</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.12em] text-cream/50">
                  <th className="py-2 pr-3 font-normal">Cláusula</th>
                  <th className="py-2 pr-3 font-normal">Tipo</th>
                  <th className="py-2 pr-3 text-right font-normal">Mensal</th>
                  <th className="py-2 pr-3 text-right font-normal">Anual (13m)</th>
                  <th className="py-2 text-right font-normal">% folha</th>
                </tr>
              </thead>
              <tbody>
                {r.linhas.map((l, idx) => (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-3 text-cream">{l.nome || `Cláusula ${idx + 1}`}</td>
                    <td className="py-2.5 pr-3 text-cream/55">
                      {l.tipo === 'percentual' ? '% sobre a folha' : 'R$ por empregado'}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-cream">
                      {brl(l.custoMensal)}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-cream/70">
                      {brl(l.custoAnual)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-cream/70">
                      {r.folha > 0 ? pctFmt(l.pctFolha) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-xs text-cream/40">
        Estimativa de apoio à negociação. Confirme os números com a folha real e a contabilidade
        antes de apresentar em mesa.
      </p>
    </div>
  );
}
