import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { normalizeAccountPetRow, prioritizeAccountPets, type AccountPet } from "@/lib/account/pets";

export async function getAccountPets(requireSession = true, nextPath = "/mis-mascotas"): Promise<{ authenticated: boolean; pets: AccountPet[]; error: string | null }> {
  if (!hasSupabaseEnv()) {
    return { authenticated: false, pets: [], error: "Supabase todavía no está configurado para esta instalación." };
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options);
      } catch {
        // Server Components pueden leer la sesión aunque no puedan escribir cookies.
      }
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (requireSession) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    return { authenticated: false, pets: [], error: null };
  }

  const { data, error } = await supabase
    .from("pet_ownerships")
    .select("pet_id, rol, started_at, pets(id, codigo_publico, nombre, especie, estado, slug, raza, adopcion_publicada)")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false });

  if (error) return { authenticated: true, pets: [], error: "No pudimos cargar tus mascotas. Intenta de nuevo." };

  const pets = (data ?? []).map(normalizeAccountPetRow).filter((pet): pet is AccountPet => pet !== null);
  if (pets.length === 0) return { authenticated: true, pets, error: null };

  const { data: photos, error: photoError } = await supabase
    .from("pet_documents")
    .select("pet_id, object_path, created_at")
    .in("pet_id", pets.map((pet) => pet.id))
    .eq("bucket_id", "pawpass-fotos")
    .eq("categoria", "foto")
    .eq("tipo", "imagen")
    .order("created_at", { ascending: true });

  if (photoError) return { authenticated: true, pets, error: "No pudimos cargar las fotos privadas de tus mascotas." };

  const firstPhotoByPet = new Map<string, string>();
  for (const photo of photos ?? []) {
    if (!firstPhotoByPet.has(photo.pet_id)) firstPhotoByPet.set(photo.pet_id, photo.object_path);
  }

  const withPhotos = await Promise.all(pets.map(async (pet) => {
    const path = firstPhotoByPet.get(pet.id);
    if (!path) return { ...pet, photoUrl: null };
    const { data: signed } = await supabase.storage.from("pawpass-fotos").createSignedUrl(path, 300);
    return { ...pet, photoUrl: signed?.signedUrl ?? null };
  }));

  return { authenticated: true, pets: prioritizeAccountPets(withPhotos), error: null };
}

export async function getAccountSettingsData(): Promise<{
  userId: string;
  fullName: string;
  email: string;
  petsCount: number | null;
  error: string | null;
}> {
  if (!hasSupabaseEnv()) return { userId: "", fullName: "", email: "", petsCount: null, error: "Supabase todavía no está configurado para esta instalación." };
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try { for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options); }
      catch { /* Server Components pueden leer la sesión aunque no puedan escribir cookies. */ }
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fcuenta");
  const [profileResult, ownershipResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("pet_ownerships").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("ended_at", null),
  ]);
  const profileName = typeof profileResult.data?.full_name === "string" ? profileResult.data.full_name.trim() : "";
  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  return {
    userId: user.id,
    fullName: profileName || metadataName,
    email: user.email ?? "",
    petsCount: ownershipResult.error || ownershipResult.count === null ? null : ownershipResult.count,
    error: ownershipResult.error || ownershipResult.count === null ? "No pudimos verificar cuántas mascotas están asociadas a tu cuenta. El borrado seguirá bloqueado hasta poder comprobarlo." : null,
  };
}
