import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { initials } from '@irts/shared';
import { useAuth } from '@/context/AuthProvider';
import { Screen, Card } from '@/components';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface MenuLink {
  href: Href;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const LINKS: MenuLink[] = [
  { href: '/mais/agenda', label: 'Agenda', description: 'Mentorias, lives e eventos', icon: 'calendar' },
  { href: '/mais/comunidade', label: 'Comunidade', description: 'Fórum e networking', icon: 'people' },
  { href: '/mais/conta', label: 'Minha Conta', description: 'Perfil, plano e configurações', icon: 'person' },
];

export default function MaisScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const name = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? 'Membro IRTS';

  return (
    <Screen>
      <Text style={styles.h1}>Mais</Text>

      <Card onPress={() => router.push('/mais/conta')}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </Card>

      <View style={styles.list}>
        {LINKS.map((l) => (
          <Card key={l.label} onPress={() => router.push(l.href)}>
            <View style={styles.linkRow}>
              <View style={styles.iconBox}>
                <Ionicons name={l.icon} size={20} color={colors.gold} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.linkLabel}>{l.label}</Text>
                <Text style={styles.linkDesc}>{l.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  h1: { fontFamily: 'serif', fontSize: typography.sizes['2xl'], color: colors.textPrimary, fontWeight: '600' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(201,162,39,0.15)', // colors.goldLight @15%
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.gold, fontWeight: '700', fontSize: typography.sizes.lg },
  name: { color: colors.textPrimary, fontSize: typography.sizes.base, fontWeight: '600' },
  email: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  list: { gap: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { color: colors.textPrimary, fontSize: typography.sizes.base, fontWeight: '600' },
  linkDesc: { color: colors.textSecondary, fontSize: typography.sizes.sm },
});
