/**
 * Lectura y validación del entorno de Supabase (T3).
 *
 * Solo variables públicas (`NEXT_PUBLIC_*`). La `service_role` NUNCA se expone
 * al cliente ni se lee aquí: queda reservada al servidor fuera de este módulo.
 */

export type SupabaseEnv = {
  url: string;
  /** Publishable key (preferred) or legacy anon key for older projects. */
  anonKey: string;
};

function isSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname !== "";
  } catch {
    return false;
  }
}

/** ¿Está configurado el entorno mínimo de Supabase? */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    isSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

/** Devuelve `{ url, anonKey }` o lanza si falta configuración. */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseUrl(url) || !anonKey) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL con una URL HTTPS válida y una clave pública de Supabase (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY). Usa la URL completa del proyecto, por ejemplo https://tu-proyecto.supabase.co, y copia .env.example a .env.local.",
    );
  }

  return { url, anonKey };
}
