import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#C9A227', light: '#E5C767', dark: '#9A7B1E' },
        ink: '#0A0A0A',
        surface: { DEFAULT: '#16181C', alt: '#1D2026' },
        line: '#2A2E36',
        cream: '#F5F3EC',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.35)',
        gold: '0 6px 30px rgba(201,162,39,0.25)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E5C767 0%, #C9A227 50%, #9A7B1E 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
