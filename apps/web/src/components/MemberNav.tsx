'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Home, GraduationCap, BookOpen, Bot, Calendar, Users, User, LogOut, Menu, X, Shield, Bell,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { initials } from '@irts/shared';

const ITEMS = [
  { href: '/app', label: 'Início', icon: Home, exact: true },
  { href: '/app/cursos', label: 'Meus Cursos', icon: GraduationCap },
  { href: '/app/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/app/consultor-ia', label: 'Consultor IA', icon: Bot },
  { href: '/app/agenda', label: 'Agenda', icon: Calendar },
  { href: '/app/comunidade', label: 'Hub de Inteligência', icon: Users },
  { href: '/app/conta', label: 'Minha Conta', icon: User },
];

export function MemberNav({
  profile, isAdmin, unread, children,
}: {
  profile: { full_name: string | null; avatar_url: string | null } | null;
  isAdmin: boolean;
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/'); router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Nav = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-2"><Logo withText /></div>
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
            isActive(it.href, it.exact) ? 'bg-gold/10 text-gold' : 'text-cream/70 hover:bg-navy/5 hover:text-cream'
          }`}
        >
          <it.icon size={18} /> {it.label}
        </Link>
      ))}
      {isAdmin && (
        <Link href="/admin" onClick={() => setOpen(false)}
          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/70 transition hover:bg-navy/5 hover:text-gold">
          <Shield size={18} /> Administração
        </Link>
      )}
      <button onClick={signOut}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/60 transition hover:bg-navy/5 hover:text-red-400">
        <LogOut size={18} /> Sair
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-line/60 bg-surface/40 lg:block">
        <div className="sticky top-0 h-screen">{Nav}</div>
      </aside>

      {/* Drawer mobile */}
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
          <div className="flex items-center gap-4">
            <Link href="/app/conta?tab=notificacoes" className="relative text-cream/70 hover:text-gold">
              <Bell size={20} />
              {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
            <Link href="/app/conta" className="flex items-center gap-2">
              <span className="hidden text-sm text-cream/70 sm:block">{profile?.full_name ?? 'Minha conta'}</span>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">{initials(profile?.full_name)}</span>}
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
