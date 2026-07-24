/**
 * IRTS — Design tokens.
 * Tema CLARO: fundo off-white, texto azul-escuro, dourado como acento.
 * Paleta: off-white · dourado · azul escuro · preto.
 * Fonte única de verdade para web (Tailwind) e mobile (React Native).
 */
export const colors = {
  // Acento (dourado). `gold` é o tom para TEXTO sobre fundo claro (contraste AA);
  // `goldLight` é o tom vivo para fundos/gradientes de botão.
  gold: '#A98423',
  goldLight: '#C9A227',
  goldBright: '#E5C767',
  goldDark: '#7C5F14',

  // Azul escuro (texto principal e blocos de destaque)
  navy: '#101B2D',
  navyDeep: '#0A1220',
  black: '#0A0A0A',

  // Superfícies claras
  bg: '#F7F5F0',        // fundo da página (off-white)
  surface: '#FFFFFF',   // cards
  surfaceAlt: '#F1EDE4', // inputs / blocos sutis
  border: '#E4DDCF',

  // Texto
  textPrimary: '#101B2D',
  textSecondary: '#4A5568',
  textMuted: '#7A8496',

  success: '#1E7F52',
  warning: '#B57A10',
  danger: '#C0392B',
  info: '#1F5F8B',
  white: '#FFFFFF',
} as const;

export const gradients = {
  gold: 'linear-gradient(135deg, #E5C767 0%, #C9A227 50%, #A98423 100%)',
  navy: 'linear-gradient(180deg, #16243B 0%, #0A1220 100%)',
  light: 'linear-gradient(180deg, #FFFFFF 0%, #F7F5F0 100%)',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const typography = {
  fontSerif: '"Cormorant Garamond", "Playfair Display", Georgia, serif', // títulos
  fontSans: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36, '4xl': 48 },
} as const;

export const shadow = {
  card: '0 1px 2px rgba(16,27,45,0.06), 0 8px 24px rgba(16,27,45,0.06)',
  gold: '0 6px 24px rgba(201,162,39,0.28)',
} as const;

export const brand = {
  name: 'IRTS',
  fullName: 'Inteligência em Relações Trabalhistas e Sindicais',
  appName: 'IRTS Academy',
  scheme: 'irts', // deep link mobile
} as const;
