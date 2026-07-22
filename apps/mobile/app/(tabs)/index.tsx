import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatDateTime, relativeTime } from '@irts/shared';
import type { NewsItem, Announcement, EventItem, PlatformUpdate } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Screen, Card, Badge, Empty, Progress } from '@/components';
import { colors, spacing, typography } from '@/lib/theme';

interface EnrollmentRow {
  id: string;
  progress_pct: number;
  courses: { title: string; slug: string } | null;
}

export default function InicioScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [nextEvent, setNextEvent] = useState<EventItem | null>(null);
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    const [newsRes, annRes, evtRes, updRes, enrRes] = await Promise.all([
      supabase.from('news').select('*').eq('published', true).order('published_at', { ascending: false }).limit(4),
      supabase.from('announcements').select('*').eq('published', true).order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('*').eq('published', true).gte('starts_at', nowIso).order('starts_at').limit(1).maybeSingle(),
      supabase.from('platform_updates').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('enrollments').select('*, courses(title, slug)').eq('user_id', user.id).is('completed_at', null).order('last_activity_at', { ascending: false, nullsFirst: false }).limit(3),
    ]);
    setNews((newsRes.data as NewsItem[]) ?? []);
    setAnnouncements((annRes.data as Announcement[]) ?? []);
    setNextEvent((evtRes.data as EventItem) ?? null);
    setUpdates((updRes.data as PlatformUpdate[]) ?? []);
    setEnrollments((enrRes.data as EnrollmentRow[]) ?? []);
  }, [user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const firstName = (profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined))?.split(' ')[0];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View>
        <Text style={styles.greeting}>Olá{firstName ? `, ${firstName}` : ''} 👋</Text>
        <Text style={styles.subtitle}>Veja o que há de novo na plataforma.</Text>
      </View>

      {loading ? (
        <Empty title="Carregando..." icon="reload-outline" />
      ) : (
        <>
          {enrollments.length > 0 && (
            <View style={styles.section}>
              <SectionTitle icon="play-circle" text="Continuar assistindo" />
              {enrollments.map((e) => (
                <Card key={e.id} onPress={() => e.courses?.slug && router.push(`/curso/${e.courses.slug}`)}>
                  <Text style={styles.cardTitle}>{e.courses?.title ?? 'Curso'}</Text>
                  <View style={{ marginTop: spacing.sm }}>
                    <Progress value={Number(e.progress_pct)} />
                  </View>
                  <Text style={styles.muted}>{Number(e.progress_pct).toFixed(0)}% concluído</Text>
                </Card>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <SectionTitle icon="newspaper" text="Últimas notícias trabalhistas" />
            {news.length > 0 ? (
              news.map((n) => (
                <Card key={n.id}>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  {n.summary ? <Text style={styles.cardBody}>{n.summary}</Text> : null}
                  <View style={styles.rowBetween}>
                    <Text style={styles.muted}>
                      {[n.source, formatDate(n.published_at)].filter(Boolean).join(' · ')}
                    </Text>
                    {n.url ? (
                      <Pressable onPress={() => Linking.openURL(n.url!)}>
                        <Text style={styles.link}>Ler →</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </Card>
              ))
            ) : (
              <Empty title="Sem notícias ainda" description="As notícias trabalhistas aparecerão aqui." icon="newspaper-outline" />
            )}
          </View>

          <View style={styles.section}>
            <SectionTitle icon="calendar" text="Próxima live" />
            {nextEvent ? (
              <Card onPress={() => router.push('/mais/agenda')}>
                <Badge label={nextEvent.type} tone="gold" />
                <Text style={styles.cardTitle}>{nextEvent.title}</Text>
                <Text style={styles.cardBody}>{formatDateTime(nextEvent.starts_at)}</Text>
              </Card>
            ) : (
              <Empty title="Nada agendado" icon="calendar-outline" />
            )}
          </View>

          {announcements.length > 0 && (
            <View style={styles.section}>
              <SectionTitle icon="megaphone" text="Avisos" />
              {announcements.map((a) => (
                <Card key={a.id}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  {a.body ? <Text style={styles.cardBody}>{a.body}</Text> : null}
                </Card>
              ))}
            </View>
          )}

          {updates.length > 0 && (
            <View style={styles.section}>
              <SectionTitle icon="sparkles" text="Atualizações" />
              {updates.map((u) => (
                <View key={u.id} style={styles.updateRow}>
                  <Text style={styles.link}>{u.version} </Text>
                  <Text style={styles.cardTitle}>{u.title}</Text>
                  <Text style={styles.muted}>{relativeTime(u.created_at)}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function SectionTitle({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={18} color={colors.gold} />
      <Text style={styles.sectionTitle}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { fontFamily: 'serif', fontSize: typography.sizes['2xl'], color: colors.textPrimary, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: 2 },
  section: { gap: spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { fontFamily: 'serif', fontSize: typography.sizes.lg, color: colors.textPrimary, fontWeight: '600' },
  cardTitle: { color: colors.textPrimary, fontSize: typography.sizes.base, fontWeight: '600' },
  cardBody: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  muted: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  link: { color: colors.gold, fontSize: typography.sizes.sm, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  updateRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
});
