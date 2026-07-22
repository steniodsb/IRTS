/**
 * IRTS — Design tokens (marca: ouro sobre preto).
 * Fonte única de verdade para web (Tailwind) e mobile (React Native).
 */
export const colors = {
  gold: '#C9A227',
  goldLight: '#E5C767',
  goldDark: '#9A7B1E',
  black: '#0A0A0A',
  ink: '#111214',
  surface: '#16181C',
  surfaceAlt: '#1D2026',
  border: '#2A2E36',
  textPrimary: '#F5F3EC',
  textSecondary: '#B9B6AC',
  textMuted: '#7E7C74',
  success: '#3DBE7A',
  warning: '#E0A536',
  danger: '#E05656',
  info: '#4A9BD4',
  white: '#FFFFFF',
} as const;

export const gradients = {
  gold: 'linear-gradient(135deg, #E5C767 0%, #C9A227 50%, #9A7B1E 100%)',
  dark: 'linear-gradient(180deg, #16181C 0%, #0A0A0A 100%)',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const typography = {
  fontSerif: '"Cormorant Garamond", "Playfair Display", Georgia, serif', // títulos (elegante como a logo)
  fontSans: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, '4xl': 48 },
} as const;

export const shadow = {
  card: '0 4px 24px rgba(0,0,0,0.35)',
  gold: '0 6px 30px rgba(201,162,39,0.25)',
} as const;

export const brand = {
  name: 'IRTS',
  fullName: 'Inteligência em Relações Trabalhistas e Sindicais',
  appName: 'IRTS Academy',
  scheme: 'irts', // deep link mobile
} as const;
