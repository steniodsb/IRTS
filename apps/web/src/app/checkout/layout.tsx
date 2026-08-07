import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = { title: 'Checkout' };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="surface-navy border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Logo withText />
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 text-xs text-cream/50 sm:flex">
              <Lock size={13} className="text-gold" /> Pagamento seguro
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/planos"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-cream/50 transition hover:text-gold"
        >
          <ArrowLeft size={15} /> Voltar
        </Link>
        {children}
      </main>
    </div>
  );
}
