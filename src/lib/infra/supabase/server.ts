/**
 * Cliente de Supabase para el servidor (T3).
 *
 * No importa `next/headers` directamente: recibe un `SupabaseCookieStore` por
 * inyección. Así esta capa (`infra`) respeta la guarda arquitectónica que
 * prohíbe depender de Next.js, y el adaptador de cookies vive en `app`.
 *
 * Solo usa la clave pública `anon`. `service_role` queda fuera por diseño.
 */

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export type SupabaseCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Contrato mínimo compatible con el `cookies()` de `next/headers`.
 * `setAll` puede fallar en Server Components; el adaptador de `app` decide cómo
 * manejarlo.
 */
export type SupabaseCookieStore = {
  getAll(): { name: string; value: string }[];
  setAll(cookies: SupabaseCookie[]): void;
};

/** Crea un cliente de Supabase ligado a una tienda de cookies concreta. */
export function createSupabaseServerClient(cookieStore: SupabaseCookieStore) {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookieStore.setAll(cookiesToSet);
      },
    },
  });
}
