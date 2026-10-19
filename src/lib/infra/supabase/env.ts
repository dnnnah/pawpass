/**
 * Lectura y validación del entorno de Supabase (T3).
 *
 * Solo variables públicas (`NEXT_PUBLIC_*`). La `service_role` NUNCA se expone
 * al cliente ni se lee aquí: queda reservada al servidor fuera de este módulo.
 */

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

/** ¿Está configurado el entorno mínimo de Supabase? */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Devuelve `{ url, anonKey }` o lanza si falta configuración. */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env.local.",
    );
  }

  return { url, anonKey };
}
