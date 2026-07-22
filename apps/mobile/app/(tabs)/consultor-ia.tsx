import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { AiCitation } from '@irts/shared';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: AiCitation[];
}

const FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/consultor-ia`;

export default function ConsultorIaScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply ?? data.content ?? data.answer ?? 'Sem resposta.',
        citations: (data.citations as AiCitation[]) ?? [],
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: 'Não consegui responder agora. Verifique sua conexão e tente novamente.',
        },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={18} color={colors.gold} />
        <Text style={styles.headerTitle}>Consultor IA</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.intro}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
              <Text style={styles.introTitle}>Tire suas dúvidas trabalhistas</Text>
              <Text style={styles.introText}>
                Pergunte sobre CLT, ACT/CCT, jurisprudência e rotinas sindicais. As respostas citam
                as fontes da base de conhecimento IRTS.
              </Text>
            </View>
          ) : (
            messages.map((m) => <Bubble key={m.id} message={m} />)
          )}
          {sending ? (
            <View style={[styles.bubble, styles.assistant]}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escreva sua pergunta..."
            placeholderTextColor={colors.textMuted}
            multiline
            editable={!sending}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim() || sending}
          >
            <Ionicons name="send" size={18} color={colors.black} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
      <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.content}</Text>
      {message.citations && message.citations.length > 0 ? (
        <View style={styles.citations}>
          <Text style={styles.citationsLabel}>Fontes</Text>
          {message.citations.map((c, i) => (
            <Text key={`${message.id}-c-${i}`} style={styles.citation} numberOfLines={2}>
              • {c.content}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: 'serif', fontSize: typography.sizes.lg, color: colors.textPrimary, fontWeight: '600' },
  messages: { padding: spacing.md, gap: spacing.sm },
  intro: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.md },
  introTitle: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: '600', textAlign: 'center' },
  introText: { color: colors.textSecondary, fontSize: typography.sizes.sm, textAlign: 'center' },
  bubble: { maxWidth: '85%', borderRadius: radius.lg, padding: spacing.md },
  user: { alignSelf: 'flex-end', backgroundColor: colors.gold },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.textPrimary, fontSize: typography.sizes.base, lineHeight: 22 },
  bubbleTextUser: { color: colors.black, fontWeight: '500' },
  citations: { marginTop: spacing.sm, gap: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm },
  citationsLabel: { color: colors.gold, fontSize: typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  citation: { color: colors.textSecondary, fontSize: typography.sizes.xs },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.ink,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
