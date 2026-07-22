import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseClient } from '@irts/shared';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Aviso em dev; em produção as vars vêm do app.config / EAS.
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes. ' +
      'Crie apps/mobile/.env a partir de .env.example.',
  );
}

/**
 * Client Supabase do app mobile.
 * - AsyncStorage guarda a sessão de auth.
 * - autoRefreshToken + persistSession mantêm o usuário logado.
 * - detectSessionInUrl:false porque não há URL de callback no RN.
 */
export const supabase = createSupabaseClient(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'anon',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
