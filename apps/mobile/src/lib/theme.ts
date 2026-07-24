/**
 * Tema mobile IRTS — reexporta os tokens compartilhados e adiciona
 * helpers específicos de React Native (StyleSheet).
 *
 * Tema CLARO: fundo off-white (`colors.bg`), cards brancos (`colors.surface`),
 * texto azul-escuro (`colors.textPrimary`) e dourado como acento.
 */
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, spacing, typography, brand } from '@irts/shared';

export { colors, radius, spacing, typography, brand };

// Família serifada para títulos (fallback nativo; carregar fonte real depois).
export const fonts = {
  serif: 'serif',
  sans: 'System',
} as const;

/**
 * Sombras do tema claro: elevação leve.
 * iOS usa `shadow*` (opacidade baixa, cor azul-escuro), Android usa `elevation`.
 */
export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.navy,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  gold: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.goldLight,
      shadowOpacity: 0.28,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle,
} as const;

export const theme = {
  colors,
  radius,
  spacing,
  typography,
  fonts,
  shadows,
} as const;

/** Estilos base reutilizáveis entre telas. */
export const g = StyleSheet.create({
  flex1: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  surface: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  textPrimary: { color: colors.textPrimary, fontSize: typography.sizes.base },
  textSecondary: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  textMuted: { color: colors.textMuted, fontSize: typography.sizes.xs },
  gold: { color: colors.gold },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
