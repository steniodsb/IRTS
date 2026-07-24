import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthProvider';
import { GoldButton } from '@/components';
import { Field } from './login';
import { colors, spacing, radius, shadows, typography, brand } from '@/lib/theme';

const logo = require('../../assets/brand/irts-logo.jpeg');

export default function CadastroScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (!fullName || !email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setDone(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>{brand.appName}</Text>
            <Text style={styles.tagline}>Crie sua conta</Text>
          </View>

          {done ? (
            <View style={styles.doneBox}>
              <Text style={styles.doneTitle}>Conta criada!</Text>
              <Text style={styles.doneText}>
                Enviamos um e-mail de confirmação para {email}. Confirme para acessar.
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.link}>Voltar para o login</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.form}>
              <Field
                label="Nome completo"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Seu nome"
                autoCapitalize="words"
              />
              <Field
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Field
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <GoldButton label="Criar conta" onPress={handleSignUp} loading={loading} />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Já tem conta? </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <Text style={styles.link}>Entrar</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.sm },
  logo: { width: 96, height: 96, borderRadius: radius.lg },
  brand: {
    fontFamily: 'serif',
    fontSize: typography.sizes['3xl'],
    color: colors.gold,
    fontWeight: '600',
  },
  tagline: { color: colors.textSecondary, fontSize: typography.sizes.base },
  form: { gap: spacing.md },
  error: { color: colors.danger, fontSize: typography.sizes.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
  footerText: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  link: { color: colors.gold, fontSize: typography.sizes.sm, fontWeight: '600' },
  doneBox: {
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  doneTitle: { color: colors.gold, fontSize: typography.sizes.xl, fontWeight: '700' },
  doneText: { color: colors.textSecondary, fontSize: typography.sizes.sm, textAlign: 'center' },
});
