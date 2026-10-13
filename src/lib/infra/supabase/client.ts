/**
 * Cliente de Supabase para el navegador (T3).
 *
 * Usa `@supabase/ssr` para persistir la sesión en cookies (no `localStorage`),
 * de modo que el servidor pueda leerla. Solo la clave pública `anon`.
 */

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** Crea (o reutiliza) el cliente de Supabase del navegador. */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey);
}
