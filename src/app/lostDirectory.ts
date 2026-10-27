import { cookies } from "next/headers";
import { createSupabasePublicPetDirectory } from "@/lib/infra/directory/supabasePublicPets";
import { staticPublicPetDirectory } from "@/lib/infra/directory/staticPublicPets";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { getLostPetCards } from "@/lib/services/pets/public";
import type { PublicPetCard } from "@/types/publicPet";

export async function loadPublicLostPets(): Promise<{ pets: PublicPetCard[]; error: string | null }> {
  if (!hasSupabaseEnv()) {
    if (process.env.NODE_ENV !== "production") return { pets: await getLostPetCards(staticPublicPetDirectory), error: null };
    return { pets: [], error: "No pudimos cargar las alertas activas. Verifica la conexión de Supabase e intenta de nuevo." };
  }
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try { for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options); }
      catch { /* Server Components solo pueden leer cookies. */ }
    },
  });
  try {
    return { pets: await getLostPetCards(createSupabasePublicPetDirectory(supabase)), error: null };
  } catch {
    return { pets: [], error: "No pudimos cargar las alertas activas. Intenta de nuevo." };
  }
}
