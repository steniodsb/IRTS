import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface GoldButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
  style?: ViewStyle;
}

export function GoldButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'solid',
  style,
}: GoldButtonProps) {
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.solid,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
    >
      <View style={styles.inner}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={isOutline ? colors.gold : colors.navy}
            style={{ marginRight: spacing.sm }}
          />
        )}
        <Text style={[styles.label, isOutline ? styles.labelOutline : styles.labelSolid]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center' },
  // Dourado vivo no fundo + texto azul-escuro: contraste alto sobre o tema claro.
  solid: { backgroundColor: colors.goldLight },
  outline: { borderWidth: 1, borderColor: colors.gold, backgroundColor: 'transparent' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { fontSize: typography.sizes.base, fontWeight: '700' },
  labelSolid: { color: colors.navy },
  labelOutline: { color: colors.gold },
});
