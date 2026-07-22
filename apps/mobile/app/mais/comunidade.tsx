import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { relativeTime } from '@irts/shared';
import type { ForumThread } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { Screen, Card, Badge, Empty } from '@/components';
import { colors, spacing, typography } from '@/lib/theme';

export default function ComunidadeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threads, setThreads] = useState<ForumThread[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('forum_threads')
      .select('*')
      .order('pinned', { ascending: false })
      .order('last_activity_at', { ascending: false })
      .limit(30);
    setThreads((data as ForumThread[]) ?? []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.subtitle}>Discussões, dúvidas e networking entre membros.</Text>

      {loading ? (
        <Empty title="Carregando..." icon="reload-outline" />
      ) : threads.length > 0 ? (
        threads.map((t) => (
          <Card key={t.id} onPress={() => router.push(`/comunidade/${t.id}`)}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{t.title}</Text>
              {t.pinned ? <Badge label="Fixado" tone="gold" /> : null}
            </View>
            <Text style={styles.body} numberOfLines={2}>{t.body}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} />
                <Text style={styles.muted}>{t.reply_count}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                <Text style={styles.muted}>{t.views}</Text>
              </View>
              <Text style={styles.muted}>{relativeTime(t.last_activity_at)}</Text>
            </View>
          </Card>
        ))
      ) : (
        <Empty title="Nenhuma discussão ainda" description="Seja o primeiro a iniciar um tópico." icon="people-outline" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  title: { color: colors.textPrimary, fontSize: typography.sizes.base, fontWeight: '600', flexShrink: 1 },
  body: { color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: spacing.xs },
  muted: { color: colors.textMuted, fontSize: typography.sizes.xs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
