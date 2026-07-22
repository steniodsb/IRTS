import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { EVENT_TYPE_LABELS, formatDateTime } from '@irts/shared';
import type { EventItem } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Screen, Card, Badge, Empty, GoldButton } from '@/components';
import { colors, spacing, typography } from '@/lib/theme';

export default function AgendaScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registered, setRegistered] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const [evtRes, regRes] = await Promise.all([
      supabase.from('events').select('*').eq('published', true).gte('starts_at', nowIso).order('starts_at'),
      user
        ? supabase.from('event_registrations').select('event_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] as { event_id: string }[] }),
    ]);
    setEvents((evtRes.data as EventItem[]) ?? []);
    setRegistered(new Set(((regRes.data as { event_id: string }[]) ?? []).map((r) => r.event_id)));
  }, [user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function register(ev: EventItem) {
    if (!user) return;
    setBusy(ev.id);
    const { error } = await supabase
      .from('event_registrations')
      .insert({ event_id: ev.id, user_id: user.id });
    if (!error) setRegistered((prev) => new Set(prev).add(ev.id));
    setBusy(null);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.subtitle}>Próximos eventos, mentorias e lives.</Text>

      {loading ? (
        <Empty title="Carregando..." icon="reload-outline" />
      ) : events.length > 0 ? (
        events.map((ev) => {
          const isRegistered = registered.has(ev.id);
          return (
            <Card key={ev.id}>
              <Badge label={EVENT_TYPE_LABELS[ev.type]} tone="gold" />
              <Text style={styles.title}>{ev.title}</Text>
              <Text style={styles.datetime}>{formatDateTime(ev.starts_at)}</Text>
              {ev.location ? <Text style={styles.muted}>{ev.location}</Text> : null}
              {ev.description ? <Text style={styles.body}>{ev.description}</Text> : null}

              <View style={styles.actions}>
                {isRegistered ? (
                  <Badge label="Inscrito" tone="success" />
                ) : (
                  <GoldButton
                    label="Inscrever-se"
                    variant="outline"
                    loading={busy === ev.id}
                    onPress={() => register(ev)}
                  />
                )}
                {ev.join_url ? (
                  <GoldButton label="Entrar" onPress={() => Linking.openURL(ev.join_url!)} />
                ) : null}
              </View>
            </Card>
          );
        })
      ) : (
        <Empty title="Nada agendado" description="Novos eventos aparecerão aqui." icon="calendar-outline" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  title: { color: colors.textPrimary, fontSize: typography.sizes.base, fontWeight: '600', marginTop: spacing.xs },
  datetime: { color: colors.gold, fontSize: typography.sizes.sm, marginTop: 2 },
  muted: { color: colors.textMuted, fontSize: typography.sizes.xs },
  body: { color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: spacing.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
});
