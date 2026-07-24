'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Badge } from '@/components/ui';
import { NumberField, Field, ResultRow, BigStat } from './fields';
import {
  addMonths,
  brl,
  dateFmt,
  daysLabel,
  diffDays,
  numFmt,
  pctFmt,
  safeDiv,
  parseDateInput,
  toNum,
} from './format';

export function CalcBancoHoras() {
  const [creditadas, setCreditadas] = useState('180');
  const [compensadas, setCompensadas] = useState('60');
  const [jornada, setJornada] = useState('220');
  const [adicional, setAdicional] = useState('50');
  const [salarioHora, setSalarioHora] = useState('18.50');
  const [prazoMeses, setPrazoMeses] = useState('6');
  const [inicio, setInicio] = useState('');

  // `hoje` só é definido no cliente, para não gerar divergência de hidratação.
  const [hoje, setHoje] = useState<Date | null>(null);
  useEffect(() => {
    const d = new Date();
    setHoje(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  }, []);

  const r = useMemo(() => {
    const cred = Math.max(0, toNum(creditadas));
    const comp = Math.max(0, toNum(compensadas));
    const jorn = Math.max(0, toNum(jornada));
    const adic = Math.max(0, toNum(adicional)) / 100;
    const sh = Math.max(0, toNum(salarioHora));
    const meses = Math.max(0, Math.floor(toNum(prazoMeses)));

    const saldo = cred - comp;
    const saldoDevedor = Math.max(0, saldo); // horas a compensar pela empresa
    const saldoNegativo = Math.max(0, -saldo); // horas devidas pelo empregado

    const dataInicio = parseDateInput(inicio);
    const dataFim = dataInicio && meses > 0 ? addMonths(dataInicio, meses) : null;

    const diasRestantes = hoje && dataFim ? diffDays(hoje, dataFim) : null;
    const vencido = diasRestantes !== null && diasRestantes < 0;
    const proximoDoLimite =
      diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 30;

    // Custo se o saldo não compensado virar hora extra
    const valorHoraExtra = sh * (1 + adic);
    const custoHoraExtra = saldoDevedor * valorHoraExtra;
    const custoSemAdicional = saldoDevedor * sh;

    // Ritmo necessário para zerar o saldo dentro do prazo
    const mesesRestantes =
      diasRestantes !== null && diasRestantes > 0 ? diasRestantes / 30 : 0;
    const horasPorMesNecessarias = mesesRestantes > 0 ? safeDiv(saldoDevedor, mesesRestantes) : 0;

    return {
      cred,
      comp,
      jorn,
      saldo,
      saldoDevedor,
      saldoNegativo,
      pctJornada: safeDiv(saldoDevedor, jorn) * 100,
      jornadasEquivalentes: safeDiv(saldoDevedor, jorn),
      dataInicio,
      dataFim,
      diasRestantes,
      vencido,
      proximoDoLimite,
      valorHoraExtra,
      custoHoraExtra,
      custoSemAdicional,
      diferenca: custoHoraExtra - custoSemAdicional,
      horasPorMesNecessarias,
      adicPct: adic * 100,
      meses,
    };
  }, [creditadas, compensadas, jornada, adicional, salarioHora, prazoMeses, inicio, hoje]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* ------------------------------------------------ Entradas */}
      <Card className="h-fit space-y-4">
        <p className="font-serif text-lg text-cream">Dados do acordo</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Horas creditadas"
            value={creditadas}
            onChange={setCreditadas}
            hint="Horas trabalhadas a mais."
            placeholder="0"
          />
          <NumberField
            label="Horas compensadas"
            value={compensadas}
            onChange={setCompensadas}
            hint="Horas já folgadas."
            placeholder="0"
          />
        </div>

        <NumberField
          label="Jornada mensal (horas)"
          value={jornada}
          onChange={setJornada}
          hint="Ex.: 220h para 44h semanais."
          placeholder="220"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Adicional de hora extra (%)"
            value={adicional}
            onChange={setAdicional}
            hint="Mínimo legal: 50%."
            placeholder="50"
          />
          <NumberField
            label="Salário-hora (R$)"
            value={salarioHora}
            onChange={setSalarioHora}
            placeholder="0,00"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Prazo do acordo (meses)"
            value={prazoMeses}
            onChange={setPrazoMeses}
            step={1}
            hint="Acordo individual: até 6 meses."
            placeholder="6"
          />
          <Field label="Data de início">
            <input
              type="date"
              className="input"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* ------------------------------------------------ Resultado */}
      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-lg text-cream">Saldo do banco</p>
            {r.saldo > 0 ? (
              <Badge tone="gold">Saldo credor do empregado</Badge>
            ) : r.saldo < 0 ? (
              <Badge tone="warning">Saldo devedor do empregado</Badge>
            ) : (
              <Badge tone="success">Banco zerado</Badge>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <BigStat
              label="Saldo de horas"
              value={`${numFmt(r.saldo, 2)} h`}
              hint={
                r.saldo >= 0
                  ? 'Horas ainda não compensadas.'
                  : 'Horas devidas pelo empregado à empresa.'
              }
            />
            <BigStat
              label="Custo se virar hora extra"
              value={brl(r.custoHoraExtra)}
              hint={`Saldo × salário-hora × (1 + ${pctFmt(r.adicPct, 0)})`}
            />
          </div>

          <div className="mt-4">
            <ResultRow label="Horas creditadas" value={`${numFmt(r.cred, 2)} h`} />
            <ResultRow label="Horas compensadas" value={`${numFmt(r.comp, 2)} h`} />
            <ResultRow label="Saldo a compensar" value={`${numFmt(r.saldoDevedor, 2)} h`} strong />
            <ResultRow
              label="Equivalente à jornada mensal"
              value={r.jorn > 0 ? `${numFmt(r.jornadasEquivalentes, 2)} jornada(s)` : '—'}
              hint={r.jorn > 0 ? pctFmt(r.pctJornada) + ' de uma jornada mensal' : 'Informe a jornada mensal.'}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-lg text-cream">Prazo de compensação</p>
            {r.vencido ? (
              <Badge tone="warning">Prazo vencido</Badge>
            ) : r.proximoDoLimite ? (
              <Badge tone="warning">Prazo próximo do fim</Badge>
            ) : r.dataFim ? (
              <Badge tone="success">Dentro do prazo</Badge>
            ) : null}
          </div>

          {!r.dataInicio || r.meses === 0 ? (
            <p className="text-sm text-cream/50">
              Informe a data de início e o prazo do acordo (em meses) para calcular o limite de
              compensação.
            </p>
          ) : (
            <>
              <ResultRow label="Início do acordo" value={dateFmt(r.dataInicio)} />
              <ResultRow label="Prazo final da compensação" value={dateFmt(r.dataFim)} strong />
              <ResultRow
                label="Situação"
                value={r.diasRestantes === null ? '—' : daysLabel(r.diasRestantes)}
              />
              {r.saldoDevedor > 0 && r.diasRestantes !== null && r.diasRestantes > 0 && (
                <ResultRow
                  label="Ritmo necessário para zerar"
                  value={`${numFmt(r.horasPorMesNecessarias, 1)} h/mês`}
                  hint="Estimativa considerando meses de 30 dias."
                />
              )}

              {r.vencido && r.saldoDevedor > 0 && (
                <div className="mt-4 rounded-xl border border-line bg-surface-alt p-4">
                  <div className="mb-2">
                    <Badge tone="warning">Atenção</Badge>
                  </div>
                  <p className="text-sm text-cream/70">
                    O prazo do acordo já se encerrou e ainda há{' '}
                    <span className="text-cream">{numFmt(r.saldoDevedor, 2)} h</span> em aberto.
                    Nessa hipótese, o saldo tende a ser pago como hora extra:{' '}
                    <span className="text-gold">{brl(r.custoHoraExtra)}</span>.
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <p className="mb-3 font-serif text-lg text-cream">Se o saldo virar hora extra</p>
          <ResultRow label="Valor da hora extra" value={brl(r.valorHoraExtra)} />
          <ResultRow label="Saldo pago sem adicional" value={brl(r.custoSemAdicional)} />
          <ResultRow label="Saldo pago como hora extra" value={brl(r.custoHoraExtra)} strong />
          <ResultRow label="Diferença (custo do adicional)" value={brl(r.diferenca)} />
        </Card>

        <p className="text-xs text-cream/40">
          Estimativa de apoio à negociação. Prazos e adicionais dependem do que estiver pactuado em
          convenção, acordo coletivo ou acordo individual.
        </p>
      </div>
    </div>
  );
}
