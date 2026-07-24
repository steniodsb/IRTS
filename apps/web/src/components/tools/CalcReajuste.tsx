'use client';

import { useMemo, useState } from 'react';
import { Card, Badge } from '@/components/ui';
import { NumberField, ResultRow, BigStat } from './fields';
import { brl, numFmt, pctFmt, safeDiv, toNum } from './format';

export function CalcReajuste() {
  const [massa, setMassa] = useState('500000');
  const [empregados, setEmpregados] = useState('120');
  const [indice, setIndice] = useState('4.5');
  const [ganhoReal, setGanhoReal] = useState('2');
  const [encargos, setEncargos] = useState('70');

  const r = useMemo(() => {
    const folha = Math.max(0, toNum(massa));
    const qtd = Math.max(0, Math.floor(toNum(empregados)));
    const i = toNum(indice) / 100;
    const g = toNum(ganhoReal) / 100;
    const enc = Math.max(0, toNum(encargos)) / 100;

    // Reajuste composto: (1 + índice) × (1 + ganho real) − 1
    const reajuste = (1 + i) * (1 + g) - 1;

    const aumentoMensal = folha * reajuste;
    const novaFolhaMensal = folha + aumentoMensal;

    // 13 meses = 12 salários + 13º
    const aumentoAnual = aumentoMensal * 13;
    const novaFolhaAnual = novaFolhaMensal * 13;

    const aumentoMensalEnc = aumentoMensal * (1 + enc);
    const aumentoAnualEnc = aumentoMensalEnc * 13;
    const novaFolhaMensalEnc = novaFolhaMensal * (1 + enc);

    const salarioMedioAtual = safeDiv(folha, qtd);
    const salarioMedioNovo = safeDiv(novaFolhaMensal, qtd);
    const aumentoPorEmpregadoMes = safeDiv(aumentoMensal, qtd);
    const aumentoPorEmpregadoAno = aumentoPorEmpregadoMes * 13;

    return {
      folha,
      qtd,
      reajustePct: reajuste * 100,
      aumentoMensal,
      novaFolhaMensal,
      aumentoAnual,
      novaFolhaAnual,
      aumentoMensalEnc,
      aumentoAnualEnc,
      novaFolhaMensalEnc,
      salarioMedioAtual,
      salarioMedioNovo,
      aumentoPorEmpregadoMes,
      aumentoPorEmpregadoAno,
      encPct: enc * 100,
    };
  }, [massa, empregados, indice, ganhoReal, encargos]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* ------------------------------------------------ Entradas */}
      <Card className="h-fit space-y-4">
        <p className="font-serif text-lg text-cream">Dados da categoria</p>

        <NumberField
          label="Massa salarial mensal (R$)"
          value={massa}
          onChange={setMassa}
          hint="Total pago em salários por mês, sem encargos."
          placeholder="0,00"
        />
        <NumberField
          label="Número de empregados"
          value={empregados}
          onChange={setEmpregados}
          step={1}
          placeholder="0"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Índice do período (%)"
            value={indice}
            onChange={setIndice}
            hint="Ex.: INPC/IPCA acumulado."
            placeholder="0,00"
          />
          <NumberField
            label="Ganho real (%)"
            value={ganhoReal}
            onChange={setGanhoReal}
            hint="Aumento acima da inflação."
            placeholder="0,00"
          />
        </div>

        <NumberField
          label="Encargos (%)"
          value={encargos}
          onChange={setEncargos}
          hint="Encargos e provisões sobre a folha (padrão 70%)."
          placeholder="70"
        />
      </Card>

      {/* ------------------------------------------------ Resultado */}
      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-serif text-lg text-cream">Resultado</p>
            <Badge tone="gold">Reajuste composto</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <BigStat
              label="Reajuste total"
              value={pctFmt(r.reajustePct)}
              hint={`(1 + ${numFmt(toNum(indice))}%) × (1 + ${numFmt(toNum(ganhoReal))}%) − 1`}
            />
            <BigStat
              label="Impacto anual (13 meses)"
              value={brl(r.aumentoAnual)}
              hint="Inclui o 13º salário."
            />
          </div>

          <div className="mt-4">
            <ResultRow label="Folha mensal atual" value={brl(r.folha)} />
            <ResultRow label="Aumento mensal" value={brl(r.aumentoMensal)} strong />
            <ResultRow label="Nova folha mensal" value={brl(r.novaFolhaMensal)} />
            <ResultRow
              label="Nova folha anual (13 meses)"
              value={brl(r.novaFolhaAnual)}
            />
          </div>
        </Card>

        <Card>
          <p className="mb-3 font-serif text-lg text-cream">Com encargos ({pctFmt(r.encPct, 0)})</p>
          <ResultRow label="Aumento mensal com encargos" value={brl(r.aumentoMensalEnc)} strong />
          <ResultRow
            label="Impacto anual com encargos (13 meses)"
            value={brl(r.aumentoAnualEnc)}
          />
          <ResultRow label="Nova folha mensal com encargos" value={brl(r.novaFolhaMensalEnc)} />
        </Card>

        <Card>
          <p className="mb-3 font-serif text-lg text-cream">Por empregado</p>
          {r.qtd === 0 ? (
            <p className="text-sm text-cream/50">
              Informe o número de empregados para ver o custo individual.
            </p>
          ) : (
            <>
              <ResultRow label="Salário médio atual" value={brl(r.salarioMedioAtual)} />
              <ResultRow label="Salário médio após o reajuste" value={brl(r.salarioMedioNovo)} />
              <ResultRow
                label="Aumento por empregado / mês"
                value={brl(r.aumentoPorEmpregadoMes)}
                strong
              />
              <ResultRow
                label="Aumento por empregado / ano (13 meses)"
                value={brl(r.aumentoPorEmpregadoAno)}
              />
            </>
          )}
        </Card>

        <p className="text-xs text-cream/40">
          Estimativa para apoio à negociação. Não substitui o cálculo da folha real da empresa nem
          parecer contábil.
        </p>
      </div>
    </div>
  );
}
