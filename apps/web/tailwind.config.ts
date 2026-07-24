import type { Config } from 'tailwindcss';

/**
 * Tema CLARO (off-white). Os NOMES dos tokens foram mantidos (`ink`, `cream`,
 * `surface`, `line`) para não reescrever as centenas de usos nas páginas —
 * apenas os VALORES mudaram. `ink` = fundo, `cream` = texto.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dourado: DEFAULT tem contraste AA sobre off-white (usar em texto);
        // `light` é o tom vivo para fundos/gradientes.
        gold: { DEFAULT: '#A98423', light: '#C9A227', bright: '#E5C767', dark: '#7C5F14' },
        // Azul escuro
        navy: { DEFAULT: '#101B2D', deep: '#0A1220', soft: '#16243B' },
        // Fundo da página (off-white)
        ink: '#F7F5F0',
        // Texto principal (nome mantido por compatibilidade)
        cream: '#101B2D',
        surface: { DEFAULT: '#FFFFFF', alt: '#F1EDE4' },
        line: '#E4DDCF',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,27,45,0.06), 0 8px 24px rgba(16,27,45,0.06)',
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
