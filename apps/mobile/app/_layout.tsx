import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { Loading } from '@/components';
import { colors } from '@/lib/theme';

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
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.black } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="curso/[slug]"
        options={{
          headerShown: true,
          title: 'Curso',
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
      <Stack.Screen
        name="comunidade/[id]"
        options={{
          headerShown: true,
          title: 'Discussão',
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
      <Stack.Screen
        name="mais/agenda"
        options={{
          headerShown: true,
          title: 'Agenda',
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
      <Stack.Screen
        name="mais/comunidade"
        options={{
          headerShown: true,
          title: 'Comunidade',
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
      <Stack.Screen
        name="mais/conta"
        options={{
          headerShown: true,
          title: 'Minha Conta',
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: colors.black },
});
