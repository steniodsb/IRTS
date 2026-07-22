import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LIBRARY_TYPE_LABELS } from '@irts/shared';
import type { LibraryItem, LibraryType } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Screen, Card, Badge, Empty } from '@/components';
import { colors, radius, spacing, typography } from '@/lib/theme';

const TYPES = Object.keys(LIBRARY_TYPE_LABELS) as LibraryType[];

export default function BibliotecaScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<LibraryType | null>(null);

  const load = useCallback(async () => {
    const q = supabase.from('library_items').select('*').eq('published', true).order('created_at', { ascending: false });
    if (filter) q.eq('type', filter);
    const { data } = await q;
    setItems((data as LibraryItem[]) ?? []);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleDownload(item: LibraryItem) {
    if (!item.file_url) return;
    // Registra o download e abre o arquivo.
    if (user) {
      await supabase.from('downloads').insert({ user_id: user.id, library_item_id: item.id });
    }
    Linking.openURL(item.file_url).catch(() => {});
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.h1}>Biblioteca</Text>
      <Text style={styles.subtitle}>Materiais, modelos e documentos para download.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Todos" active={filter === null} onPress={() => setFilter(null)} />
        {TYPES.map((t) => (
          <Chip key={t} label={LIBRARY_TYPE_LABELS[t]} active={filter === t} onPress={() => setFilter(t)} />
        ))}
      </ScrollView>

      {loading ? (
        <Empty title="Carregando..." icon="reload-outline" />
      ) : items.length > 0 ? (
        items.map((item) => (
          <Card key={item.id}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Badge label={LIBRARY_TYPE_LABELS[item.type]} tone="neutral" />
            </View>
            {item.description ? <Text style={styles.cardBody}>{item.description}</Text> : null}
            <View style={styles.footerRow}>
              <Text style={styles.muted}>{item.download_count} downloads</Text>
              {item.file_url ? (
                <Pressable style={styles.dlBtn} onPress={() => handleDownload(item)}>
                  <Ionicons name="download-outline" size={16} color={colors.black} />
                  <Text style={styles.dlText}>Baixar</Text>
                </Pressable>
              ) : (
                <Text style={styles.muted}>Indisponível</Text>
              )}
            </View>
          </Card>
        ))
      ) : (
        <Empty title="Nenhum material aqui" description="Ajuste o filtro ou volte depois." icon="library-outline" />
      )}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: 'serif', fontSize: typography.sizes['2xl'], color: colors.textPrimary, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  chipTextActive: { color: colors.black, fontWeight: '700' },
  cardTitle: { color: colors.textPrimary, fontSize: typography.sizes.base, fontWeight: '600', flexShrink: 1 },
  cardBody: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  muted: { color: colors.textMuted, fontSize: typography.sizes.xs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  dlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  dlText: { color: colors.black, fontWeight: '700', fontSize: typography.sizes.sm },
});
