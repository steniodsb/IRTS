import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Tone = 'gold' | 'neutral' | 'success' | 'warning' | 'info';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  gold: { bg: 'rgba(201,162,39,0.15)', fg: colors.gold },
  neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
  success: { bg: 'rgba(61,190,122,0.15)', fg: colors.success },
  warning: { bg: 'rgba(224,165,54,0.15)', fg: colors.warning },
  info: { bg: 'rgba(74,155,212,0.15)', fg: colors.info },
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
