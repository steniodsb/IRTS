import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { initials, formatDate } from '@irts/shared';
import type { Plan } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Screen, Card, Badge, GoldButton } from '@/components';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface SubscriptionRow {
  status: string;
  current_period_end: string | null;
  plans: Plan | null;
}

export default function ContaScreen() {
  const { user, profile, signOut } = useAuth();
  const [sub, setSub] = useState<SubscriptionRow | null>(null);

  const name = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? 'Membro IRTS';

  useEffect(() => {
    if (!user) return;
    supabase
      .from('subscriptions')
      .select('status, current_period_end, plans(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSub((data as unknown as SubscriptionRow) ?? null));
  }, [user]);

  function confirmSignOut() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <Screen>
      <Card>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.role && profile.role !== 'student' ? (
              <View style={{ marginTop: spacing.xs }}>
                <Badge label={profile.role} tone="gold" />
              </View>
            ) : null}
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plano</Text>
        <Card>
          {sub?.plans ? (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.planName}>{sub.plans.name}</Text>
                <Badge
                  label={sub.status === 'active' ? 'Ativo' : sub.status}
                  tone={sub.status === 'active' ? 'success' : 'warning'}
                />
              </View>
              {sub.current_period_end ? (
                <Text style={styles.muted}>Renova em {formatDate(sub.current_period_end)}</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.planName}>Plano gratuito</Text>
              <Text style={styles.muted}>Você ainda não possui uma assinatura ativa.</Text>
            </>
          )}
        </Card>
      </View>

      {profile?.phone || profile?.cpf_cnpj ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados</Text>
          <Card>
            {profile?.phone ? <InfoRow label="Telefone" value={profile.phone} /> : null}
            {profile?.cpf_cnpj ? <InfoRow label="CPF/CNPJ" value={profile.cpf_cnpj} /> : null}
          </Card>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <GoldButton label="Sair da conta" variant="outline" onPress={confirmSignOut} />
      </View>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(201,162,39,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.gold, fontWeight: '700', fontSize: typography.sizes.xl },
  name: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: '600' },
  email: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  section: { gap: spacing.sm },
  sectionTitle: { fontFamily: 'serif', fontSize: typography.sizes.lg, color: colors.textPrimary, fontWeight: '600', marginTop: spacing.sm },
  planName: { color: colors.textPrimary, fontSize: typography.sizes.base, fontWeight: '600' },
  muted: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  infoValue: { color: colors.textPrimary, fontSize: typography.sizes.sm },
});
