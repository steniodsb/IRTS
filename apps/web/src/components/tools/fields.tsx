'use client';

import { clsx } from '@/components/clsx';

/** Campo genérico com label + dica opcional. */
export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-cream/40">{hint}</p>}
    </div>
  );
}

/** Input numérico controlado por string (permite campo vazio sem virar NaN). */
export function NumberField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  min = 0,
  max,
  step = 'any',
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | 'any';
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input
        type="number"
        inputMode="decimal"
        className="input"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

/** Linha de resultado: rótulo à esquerda, valor à direita. */
export function ResultRow({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <div>
        <p className={clsx('text-sm', strong ? 'text-cream' : 'text-cream/60')}>{label}</p>
        {hint && <p className="text-xs text-cream/40">{hint}</p>}
      </div>
      <p
        className={clsx(
          'shrink-0 text-right tabular-nums',
          strong ? 'font-serif text-xl text-gold' : 'text-cream',
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Destaque grande de um número-chave. */
export function BigStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-alt p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-cream/50">{label}</p>
      <p className="mt-1 font-serif text-2xl text-gold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-cream/40">{hint}</p>}
    </div>
  );
}
