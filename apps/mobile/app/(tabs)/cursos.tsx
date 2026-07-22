import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDuration } from '@irts/shared';
import type { Course } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Screen, Card, Badge, Empty, Progress } from '@/components';
import { colors, spacing, typography } from '@/lib/theme';

interface EnrollmentRow {
  id: string;
  progress_pct: number;
  completed_at: string | null;
  courses: Course | null;
}

export default function CursosScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [explore, setExplore] = useState<Course[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const [enrRes, courseRes] = await Promise.all([
      supabase
        .from('enrollments')
        .select('id, progress_pct, completed_at, courses(*)')
        .eq('user_id', user.id)
        .order('last_activity_at', { ascending: false, nullsFirst: false }),
      supabase
        .from('courses')
        .select('*')
        .eq('published', true)
        .order('sort_order')
        .limit(12),
    ]);
    setEnrollments((enrRes.data as unknown as EnrollmentRow[]) ?? []);
    setExplore((courseRes.data as Course[]) ?? []);
  }, [user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const enrolledIds = new Set(enrollments.map((e) => e.courses?.id));

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.h1}>Cursos</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meus cursos</Text>
        {loading ? (
          <Empty title="Carregando..." icon="reload-outline" />
        ) : enrollments.length > 0 ? (
          enrollments.map((e) =>
            e.courses ? (
              <Card key={e.id} onPress={() => router.push(`/curso/${e.courses!.slug}`)}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{e.courses.title}</Text>
                  {e.completed_at ? <Badge label="Concluído" tone="success" /> : null}
                </View>
                {e.courses.subtitle ? <Text style={styles.cardBody}>{e.courses.subtitle}</Text> : null}
                <View style={{ marginTop: spacing.sm }}>
                  <Progress value={Number(e.progress_pct)} />
                </View>
                <Text style={styles.muted}>{Number(e.progress_pct).toFixed(0)}% concluído</Text>
              </Card>
            ) : null,
          )
        ) : (
          <Empty title="Você ainda não tem cursos" description="Explore os cursos disponíveis abaixo." icon="school-outline" />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explorar cursos</Text>
        {explore.filter((c) => !enrolledIds.has(c.id)).map((c) => (
          <Card key={c.id} onPress={() => router.push(`/curso/${c.slug}`)}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{c.title}</Text>
              {c.is_free ? <Badge label="Grátis" tone="gold" /> : null}
            </View>
            {c.subtitle ? <Text style={styles.cardBody}>{c.subtitle}</Text> : null}
            <Text style={styles.muted}>
              {[c.instructor, c.duration_minutes ? formatDuration(c.duration_minutes * 60) : null].filter(Boolean).join(' · ')}
            </Text>
          </Card>
        ))}
        {!loading && explore.length === 0 ? (
          <Empty title="Nenhum curso publicado" icon="school-outline" />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: 'serif', fontSize: typography.sizes['2xl'], color: colors.textPrimary, fontWeight: '600' },
  section: { gap: spacing.sm },
  sectionTitle: { fontFamily: 'serif', fontSize: typography.sizes.lg, color: colors.textPrimary, fontWeight: '600', marginTop: spacing.sm },
  cardTitle: { color: colors.textPrimary, fontSize: typography.sizes.base, fontWeight: '600', flexShrink: 1 },
  cardBody: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  muted: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});
