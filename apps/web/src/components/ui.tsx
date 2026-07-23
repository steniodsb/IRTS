import Link from 'next/link';
import { clsx } from './clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'outline' | 'ghost';
};
export function Button({ variant = 'gold', className, ...props }: ButtonProps) {
  const v = variant === 'gold' ? 'btn-gold' : variant === 'outline' ? 'btn-outline' : 'btn-ghost';
  return <button className={clsx(v, className)} {...props} />;
}

export function LinkButton({
  variant = 'gold', className, href, children, ...props
}: { variant?: 'gold' | 'outline' | 'ghost'; href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const v = variant === 'gold' ? 'btn-gold' : variant === 'outline' ? 'btn-outline' : 'btn-ghost';
  return <Link href={href} className={clsx(v, className)} {...props}>{children}</Link>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('card p-5', className)}>{children}</div>;
}

export function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'gold' | 'success' | 'warning' }) {
  const tones = {
    default: 'border-line text-cream/80',
    gold: 'border-gold/50 text-gold',
    success: 'border-emerald-500/40 text-emerald-400',
    warning: 'border-amber-500/40 text-amber-400',
  };
  return <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs', tones[tone])}>{children}</span>;
}

export function SectionTitle({ overline, title, subtitle, center }: { overline?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? 'text-center' : ''}>
      {overline && <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold">{overline}</p>}
      <h2 className="font-serif text-3xl md:text-4xl text-cream">{title}</h2>
      {subtitle && <p className={clsx('mt-3 max-w-2xl text-cream/60', center && 'mx-auto')}>{subtitle}</p>}
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
      <div className="h-full bg-gold-gradient" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-10 text-center">
      <p className="font-serif text-xl text-cream">{title}</p>
      {description && <p className="max-w-md text-sm text-cream/50">{description}</p>}
      {action}
    </div>
  );
}
