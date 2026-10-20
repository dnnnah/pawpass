import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/** Cliente público sin sesión para contratos de lectura explícitamente anónimos. */
export function createSupabaseAnonClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
