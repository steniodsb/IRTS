import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

const NAV = [
  { href: '/cursos', label: 'Cursos' },
  { href: '/mentorias', label: 'Mentorias' },
  { href: '/livros', label: 'Livros' },
  { href: '/planos', label: 'Planos' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
];

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Logo withText />
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm text-cream/70 transition hover:text-gold">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <LinkButton href="/app" variant="gold">Área de membros</LinkButton>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm text-cream/70 hover:text-gold sm:block">Entrar</Link>
                <LinkButton href="/cadastro" variant="gold">Criar conta</LinkButton>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-line/60 bg-surface/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo withText />
            <p className="mt-4 max-w-sm text-sm text-cream/50">
              Inteligência em Relações Trabalhistas e Sindicais. Formação, biblioteca técnica,
              mentorias e Consultor IA para profissionais e sindicatos.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-cream">Navegar</p>
            <ul className="space-y-2 text-sm text-cream/50">
              {NAV.map((n) => <li key={n.href}><Link href={n.href} className="hover:text-gold">{n.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-cream">Legal</p>
            <ul className="space-y-2 text-sm text-cream/50">
              <li><Link href="/termos" className="hover:text-gold">Termos de uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-gold">Política de privacidade</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line/60 py-6 text-center text-xs text-cream/40">
          © {new Date().getFullYear()} IRTS — Inteligência em Relações Trabalhistas e Sindicais.
        </div>
      </footer>
    </div>
  );
}
