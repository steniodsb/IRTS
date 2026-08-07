'use client';
import { Moon, Sun } from 'lucide-react';
import { clsx } from './clsx';

export const THEME_KEY = 'irts-theme';

/**
 * Alterna entre tema claro e escuro adicionando/removendo a classe `dark` no
 * <html> e guardando a escolha no localStorage. O tema inicial é aplicado
 * antes da primeira pintura pelo script em `app/layout.tsx` (sem piscada).
 *
 * Os dois ícones são renderizados sempre e a visibilidade é resolvida por CSS
 * (`dark:`) — assim o HTML do servidor e o do cliente são idênticos e não há
 * erro de hidratação.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      /* localStorage bloqueado (navegação privada) — só não persiste */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar entre tema claro e escuro"
      title="Alternar tema"
      className={clsx(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-cream/70 transition hover:border-gold/50 hover:text-gold',
        className,
      )}
    >
      <Moon size={17} className="dark:hidden" />
      <Sun size={17} className="hidden dark:block" />
    </button>
  );
}
