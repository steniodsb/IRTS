'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { Field } from './fields';
import { addDays, dateFmt, dateLongFmt, daysLabel, diffDays, parseDateInput } from './format';

type Marco = {
  offset: number; // dias em relação à data-base
  titulo: string;
  descricao: string;
};

const MARCOS: Marco[] = [
  {
    offset: -90,
    titulo: 'Preparação e diagnóstico',
    descricao:
      'Levantamento da folha, do último acordo e do cumprimento das cláusulas. Montagem do comitê de negociação.',
  },
  {
    offset: -60,
    titulo: 'Pesquisa e cenário',
    descricao:
      'Consulta à base, pesquisa de reivindicações, análise do setor, dos índices e das convenções comparáveis.',
  },
  {
    offset: -45,
    titulo: 'Definição do mandato',
    descricao:
      'Assembleia para aprovar a pauta e definir limites: o que é inegociável e o que pode ser trocado.',
  },
  {
    offset: -30,
    titulo: 'Entrega da pauta',
    descricao:
      'Protocolo da pauta de reivindicações à empresa/entidade patronal e convocação para a negociação.',
  },
  {
    offset: -15,
    titulo: '1ª rodada de negociação',
    descricao: 'Abertura da mesa, apresentação da pauta e das justificativas técnicas e econômicas.',
  },
  {
    offset: 0,
    titulo: 'Data-base',
    descricao:
      'Marco legal do reajuste da categoria. A partir daqui, o que for acordado retroage a esta data.',
  },
  {
    offset: 30,
    titulo: 'Fechamento e assinatura',
    descricao:
      'Assembleia de aprovação da proposta final e assinatura da convenção/acordo coletivo.',
  },
  {
    offset: 45,
    titulo: 'Registro no MTE',
    descricao:
      'Depósito do instrumento coletivo no sistema do Ministério do Trabalho e comunicação à base.',
  },
];

export function CronogramaDataBase() {
  const [dataBase, setDataBase] = useState('');

  // `hoje` só no cliente, para evitar divergência de hidratação.
  const [hoje, setHoje] = useState<Date | null>(null);
  useEffect(() => {
    const d = new Date();
    setHoje(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  }, []);

  const base = useMemo(() => parseDateInput(dataBase), [dataBase]);

  const linha = useMemo(() => {
    if (!base) return [];
    return MARCOS.map((m) => {
      const data = addDays(base, m.offset);
      const dias = hoje ? diffDays(hoje, data) : null;
      return {
        ...m,
        data,
        dias,
        passou: dias !== null && dias < 0,
        hoje: dias === 0,
        proximo: dias !== null && dias > 0 && dias <= 15,
      };
    });
  }, [base, hoje]);

  const diasParaBase = useMemo(() => {
    if (!base || !hoje) return null;
    return diffDays(hoje, base);
  }, [base, hoje]);

  const proximoMarco = useMemo(
    () => linha.find((m) => m.dias !== null && m.dias >= 0) ?? null,
    [linha],
  );

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-end">
          <Field
            label="Data-base da categoria"
            hint="Mês/dia em que o reajuste da categoria é devido."
          >
            <input
              type="date"
              className="input"
              value={dataBase}
              onChange={(e) => setDataBase(e.target.value)}
            />
          </Field>

          {base && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">Data-base: {dateFmt(base)}</Badge>
              {diasParaBase !== null && (
                <Badge tone={diasParaBase < 0 ? 'default' : diasParaBase <= 30 ? 'warning' : 'success'}>
                  {daysLabel(diasParaBase)}
                </Badge>
              )}
              {proximoMarco && (
                <span className="chip">Próximo marco: {proximoMarco.titulo}</span>
              )}
            </div>
          )}
        </div>
      </Card>

      {!base ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarClock size={28} className="text-gold" />
          <p className="font-serif text-xl text-cream">Informe a data-base</p>
          <p className="max-w-md text-sm text-cream/50">
            Ao escolher a data-base, o cronograma completo da negociação é gerado com as datas e a
            contagem de dias de cada marco.
          </p>
        </Card>
      ) : (
        <div className="relative space-y-4 pl-6 sm:pl-8">
          {/* Trilho da timeline */}
          <span
            aria-hidden
            className="absolute left-[7px] top-2 bottom-2 w-px bg-line sm:left-[11px]"
          />

          {linha.map((m) => (
            <div key={m.offset} className="relative">
              <span
                aria-hidden
                className={`absolute -left-6 top-6 h-[15px] w-[15px] rounded-full border-2 sm:-left-8 ${
                  m.offset === 0
                    ? 'border-gold bg-gold'
                    : m.passou
                      ? 'border-line bg-surface-alt'
                      : 'border-gold/60 bg-surface'
                }`}
              />

              <Card className={m.offset === 0 ? 'border-gold/50' : undefined}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="chip">
                        {m.offset === 0
                          ? 'Data-base'
                          : m.offset < 0
                            ? `D${m.offset}`
                            : `D+${m.offset}`}
                      </span>
                      {m.offset === 0 && <Badge tone="gold">Marco legal</Badge>}
                      {m.hoje && <Badge tone="warning">É hoje</Badge>}
                      {!m.hoje && m.proximo && <Badge tone="warning">Chegando</Badge>}
                      {m.passou && <Badge>Concluído / vencido</Badge>}
                    </div>
                    <p className="font-medium text-cream">{m.titulo}</p>
                    <p className="mt-1 max-w-xl text-sm text-cream/55">{m.descricao}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-serif text-lg text-gold tabular-nums">
                      {dateLongFmt(m.data)}
                    </p>
                    <p className="text-xs text-cream/45">
                      {m.dias === null ? '—' : daysLabel(m.dias)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-cream/40">
        Cronograma-modelo de apoio ao planejamento. Ajuste os prazos ao estatuto da entidade, ao
        calendário de assembleias e ao que estiver previsto na convenção vigente.
      </p>
    </div>
  );
}
