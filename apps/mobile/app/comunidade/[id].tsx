import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { relativeTime } from '@irts/shared';
import type { ForumThread, ForumPost } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Screen, Card, Badge, Empty, Loading } from '@/components';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [threadRes, postsRes] = await Promise.all([
      supabase.from('forum_threads').select('*').eq('id', id).maybeSingle(),
      supabase.from('forum_posts').select('*').eq('thread_id', id).order('created_at'),
    ]);
    setThread((threadRes.data as ForumThread) ?? null);
    setPosts((postsRes.data as ForumPost[]) ?? []);
  }, [id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function sendReply() {
    const body = reply.trim();
    if (!body || !user || !id || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({ thread_id: id, user_id: user.id, body })
      .select('*')
      .maybeSingle();
    if (!error && data) {
      setPosts((prev) => [...prev, data as ForumPost]);
      setReply('');
    }
    setSending(false);
  }

  if (loading) return <Loading label="Carregando discussão..." />;
  if (!thread) {
    return (
      <Screen>
        <Empty title="Discussão não encontrada" icon="alert-circle-outline" />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen>
        <Stack.Screen options={{ title: 'Discussão' }} />

        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{thread.title}</Text>
            {thread.pinned ? <Badge label="Fixado" tone="gold" /> : null}
          </View>
          <Text style={styles.body}>{thread.body}</Text>
          <Text style={styles.muted}>{relativeTime(thread.created_at)}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Respostas ({posts.length})</Text>
        {posts.length > 0 ? (
          posts.map((p) => (
            <Card key={p.id}>
              <Text style={styles.body}>{p.body}</Text>
              <Text style={styles.muted}>{relativeTime(p.created_at)}</Text>
            </Card>
          ))
        ) : (
          <Empty title="Ainda sem respostas" description="Seja o primeiro a responder." icon="chatbubble-outline" />
        )}
      </Screen>

      {!thread.locked ? (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={reply}
            onChangeText={setReply}
            placeholder="Escreva uma resposta..."
            placeholderTextColor={colors.textMuted}
            multiline
            editable={!sending}
          />
          <Pressable
            style={[styles.sendBtn, (!reply.trim() || sending) && styles.disabled]}
            onPress={sendReply}
            disabled={!reply.trim() || sending}
          >
            <Ionicons name="send" size={18} color={colors.navy} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.lockedBar}>
          <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
          <Text style={styles.muted}>Discussão bloqueada para novas respostas.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: '600', flexShrink: 1 },
  body: { color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20, marginTop: spacing.xs },
  muted: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: spacing.xs },
  sectionTitle: { fontFamily: 'serif', fontSize: typography.sizes.lg, color: colors.textPrimary, fontWeight: '600', marginTop: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  lockedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
