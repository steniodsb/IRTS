'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, GraduationCap, BookOpen, Calendar, Users, UserCog,
  ShoppingBag, Newspaper, Bell, Menu, X, ExternalLink,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/cursos', label: 'Cursos', icon: GraduationCap },
  { href: '/admin/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/admin/agenda', label: 'Agenda', icon: Calendar },
  { href: '/admin/comunidade', label: 'Comunidade', icon: Users },
  { href: '/admin/usuarios', label: 'Usuários', icon: UserCog },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/conteudo', label: 'Conteúdo', icon: Newspaper },
  { href: '/admin/notificacoes', label: 'Notificações', icon: Bell },
];

export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Nav = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-2 flex items-center justify-between px-2">
        <Logo withText />
        <button className="lg:hidden text-cream/60" onClick={() => setOpen(false)}><X size={20} /></button>
      </div>
      <span className="mb-3 px-2 text-xs uppercase tracking-[0.2em] text-gold/70">Administração</span>
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
            isActive(it.href, it.exact) ? 'bg-gold/10 text-gold' : 'text-cream/70 hover:bg-white/5 hover:text-cream'
          }`}
        >
          <it.icon size={18} /> {it.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-ink">
      <aside className="hidden w-64 shrink-0 border-r border-line/60 bg-surface/40 lg:block">
        <div className="sticky top-0 h-screen">{Nav}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-line bg-surface">{Nav}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/60 bg-ink/85 px-4 py-3 backdrop-blur">
          <button className="lg:hidden text-cream" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <div className="hidden lg:block" />
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-cream/70 hover:text-gold">
            <ExternalLink size={16} /> Voltar ao site
          </Link>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
