import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { Loading } from '@/components';
import { colors } from '@/lib/theme';

/** Header do tema claro: fundo branco, título azul-escuro, botão de voltar dourado. */
const headerOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.gold,
  headerTitleStyle: { color: colors.textPrimary },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

/**
 * Guarda de navegação: decide entre o grupo (auth) e o (tabs)
 * conforme a sessão. Executa quando loading/sessão/rota mudam.
 */
function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <Loading label="Carregando..." />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="curso/[slug]" options={{ ...headerOptions, title: 'Curso' }} />
      <Stack.Screen name="comunidade/[id]" options={{ ...headerOptions, title: 'Discussão' }} />
      <Stack.Screen name="mais/agenda" options={{ ...headerOptions, title: 'Agenda' }} />
      <Stack.Screen name="mais/comunidade" options={{ ...headerOptions, title: 'Comunidade' }} />
      <Stack.Screen name="mais/conta" options={{ ...headerOptions, title: 'Minha Conta' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* Tema claro: ícones escuros na barra de status. */}
        <StatusBar style="dark" backgroundColor={colors.bg} />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: colors.bg },
});
