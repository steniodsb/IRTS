/**
 * Tema mobile IRTS — reexporta os tokens compartilhados e adiciona
 * helpers específicos de React Native (StyleSheet).
 */
import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, brand } from '@irts/shared';

export { colors, radius, spacing, typography, brand };

// Família serifada para títulos (fallback nativo; carregar fonte real depois).
export const fonts = {
  serif: 'serif',
  sans: 'System',
} as const;

export const theme = {
  colors,
  radius,
  spacing,
  typography,
  fonts,
} as const;

/** Estilos base reutilizáveis entre telas. */
export const g = StyleSheet.create({
  flex1: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.black,
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
