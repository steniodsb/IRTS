import type { Config } from 'tailwindcss';

/**
 * Os tokens (`ink`, `cream`, `surface`, `line`, `gold`) apontam para variáveis
 * CSS definidas em globals.css. Isso permite trocar o tema inteiro (claro ↔
 * escuro) sem reescrever as centenas de usos nas páginas.
 *
 *   ink   = fundo da página        cream = texto principal
 *   surface / surface-alt = cartões e campos     line = bordas
 *
 * Três escopos definem os valores:
 *   :root          → tema claro (off-white)
 *   .dark          → tema escuro
 *   .surface-navy  → bloco invertido em azul escuro (sidebar, headers,
 *                    cartões de destaque) — vale nos dois temas.
 *
 * `navy` é cor de marca fixa: não muda com o tema.
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: token('--c-gold'),
          light: token('--c-gold-light'),
          bright: token('--c-gold-bright'),
          dark: token('--c-gold-dark'),
        },
        // Azul escuro da marca — valor fixo nos dois temas.
        navy: { DEFAULT: '#101B2D', deep: '#0A1220', soft: '#16243B' },
        ink: token('--c-ink'),
        cream: token('--c-cream'),
        surface: { DEFAULT: token('--c-surface'), alt: token('--c-surface-alt') },
        line: token('--c-line'),
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        gold: '0 6px 24px rgba(201,162,39,0.28)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E5C767 0%, #C9A227 50%, #A98423 100%)',
        'navy-gradient': 'linear-gradient(180deg, #16243B 0%, #0A1220 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
