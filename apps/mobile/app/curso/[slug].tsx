import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDuration } from '@irts/shared';
import type { Course, Lesson } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Screen, Card, Badge, Empty, Progress, Loading } from '@/components';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function CursoDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!slug) return;
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    const c = (courseData as Course) ?? null;
    setCourse(c);
    if (!c) return;

    const [lessonRes, progRes] = await Promise.all([
      supabase.from('lessons').select('*').eq('course_id', c.id).eq('published', true).order('sort_order'),
      user
        ? supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', user.id).eq('course_id', c.id)
        : Promise.resolve({ data: [] as { lesson_id: string; completed: boolean }[] }),
    ]);
    setLessons((lessonRes.data as Lesson[]) ?? []);
    setCompleted(
      new Set(
        ((progRes.data as { lesson_id: string; completed: boolean }[]) ?? [])
          .filter((p) => p.completed)
          .map((p) => p.lesson_id),
      ),
    );
  }, [slug, user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function toggleComplete(lesson: Lesson) {
    if (!user || !course) return;
    const isDone = completed.has(lesson.id);
    const next = new Set(completed);
    if (isDone) next.delete(lesson.id);
    else next.add(lesson.id);
    setCompleted(next);

    await supabase.from('lesson_progress').upsert(
      {
        user_id: user.id,
        lesson_id: lesson.id,
        course_id: course.id,
        completed: !isDone,
        completed_at: !isDone ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,lesson_id' },
    );

    // Atualiza progresso do enrollment.
    const total = lessons.length || 1;
    const pct = Math.round((next.size / total) * 100);
    await supabase
      .from('enrollments')
      .update({
        progress_pct: pct,
        last_activity_at: new Date().toISOString(),
        completed_at: pct >= 100 ? new Date().toISOString() : null,
      })
      .eq('user_id', user.id)
      .eq('course_id', course.id);
  }

  function openVideo(lesson: Lesson) {
    if (lesson.video_url) Linking.openURL(lesson.video_url).catch(() => {});
  }

  if (loading) return <Loading label="Carregando curso..." />;
  if (!course) {
    return (
      <Screen>
        <Empty title="Curso não encontrado" icon="alert-circle-outline" />
      </Screen>
    );
  }

  const pct = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: course.title }} />

      <Text style={styles.title}>{course.title}</Text>
      {course.subtitle ? <Text style={styles.subtitle}>{course.subtitle}</Text> : null}
      <View style={styles.metaRow}>
        {course.instructor ? <Text style={styles.muted}>{course.instructor}</Text> : null}
        {course.level ? <Badge label={course.level} tone="neutral" /> : null}
      </View>

      {course.description ? <Text style={styles.desc}>{course.description}</Text> : null}

      <Card>
        <Text style={styles.progressLabel}>Seu progresso</Text>
        <Progress value={pct} />
        <Text style={styles.muted}>{completed.size} de {lessons.length} aulas · {pct}%</Text>
      </Card>

      <Text style={styles.sectionTitle}>Aulas</Text>
      {lessons.length > 0 ? (
        lessons.map((lesson, idx) => {
          const done = completed.has(lesson.id);
          return (
            <Card key={lesson.id}>
              <View style={styles.lessonRow}>
                <Pressable onPress={() => toggleComplete(lesson)} hitSlop={8}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={done ? colors.success : colors.textMuted}
                  />
                </Pressable>
                <Pressable style={styles.flex} onPress={() => openVideo(lesson)}>
                  <Text style={styles.lessonTitle}>
                    {idx + 1}. {lesson.title}
                  </Text>
                  <View style={styles.lessonMeta}>
                    {lesson.duration_seconds ? (
                      <Text style={styles.muted}>{formatDuration(lesson.duration_seconds)}</Text>
                    ) : null}
                    {lesson.is_preview ? <Badge label="Amostra" tone="gold" /> : null}
                  </View>
                </Pressable>
                {lesson.video_url ? (
                  <Pressable onPress={() => openVideo(lesson)} hitSlop={8}>
                    <Ionicons name="play-circle" size={26} color={colors.gold} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          );
        })
      ) : (
        <Empty title="Sem aulas publicadas" icon="film-outline" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontFamily: 'serif', fontSize: typography.sizes['2xl'], color: colors.textPrimary, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, fontSize: typography.sizes.base },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  muted: { color: colors.textMuted, fontSize: typography.sizes.xs },
  desc: { color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20 },
  progressLabel: { color: colors.textPrimary, fontSize: typography.sizes.sm, fontWeight: '600', marginBottom: spacing.xs },
  sectionTitle: { fontFamily: 'serif', fontSize: typography.sizes.lg, color: colors.textPrimary, fontWeight: '600', marginTop: spacing.sm },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lessonTitle: { color: colors.textPrimary, fontSize: typography.sizes.base },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
});
