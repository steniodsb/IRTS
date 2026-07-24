import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Tone = 'gold' | 'neutral' | 'success' | 'warning' | 'info';

/**
 * Fundos translúcidos derivados dos tokens (tema claro): tinta leve da própria
 * cor sobre superfície branca, com o texto na versão escura do token.
 */
const TONES: Record<Tone, { bg: string; fg: string }> = {
  gold: { bg: 'rgba(201,162,39,0.16)', fg: colors.goldDark }, // colors.goldLight @16%
  neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
  success: { bg: 'rgba(30,127,82,0.12)', fg: colors.success }, // colors.success @12%
  warning: { bg: 'rgba(181,122,16,0.12)', fg: colors.warning }, // colors.warning @12%
  info: { bg: 'rgba(31,95,139,0.12)', fg: colors.info }, // colors.info @12%
};

export function Badge({ label, tone = 'gold' }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
