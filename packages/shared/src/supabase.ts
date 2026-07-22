import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Fábrica de client Supabase reutilizável. Cada app passa suas opções:
 * - Web (browser/SSR) usa @supabase/ssr no próprio app.
 * - Mobile passa um storage (AsyncStorage/SecureStore).
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: Parameters<typeof createClient>[2],
): SupabaseClient {
  return createClient(url, anonKey, options);
}

export type { SupabaseClient };
