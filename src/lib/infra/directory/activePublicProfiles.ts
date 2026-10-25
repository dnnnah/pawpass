import type { PublicProfile, PublicProfileCard } from "@/types/publicProfile";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseAnonClient } from "@/lib/infra/supabase/anon";
import { createSupabasePublicPetDirectory } from "./supabasePublicPets";
import { staticPetDirectory } from "./staticPets";
import { toStaticPublicPetCard } from "@/lib/mapping/publicPet";

function supabaseDirectory() {
  const client = createSupabaseAnonClient();
  return createSupabasePublicPetDirectory({
    rpc: (name, args) => client.rpc(name, args),
    storage: { from: (bucket) => client.storage.from(bucket) },
  });
}

function allowsStaticDevelopmentDirectory(): boolean {
  return process.env.NODE_ENV !== "production";
}

export async function listActivePublicProfiles(): Promise<PublicProfileCard[]> {
  if (!hasSupabaseEnv()) {
    if (!allowsStaticDevelopmentDirectory()) throw new Error("El directorio público requiere una conexión activa con Supabase.");
    const pets = await staticPetDirectory.listProfilePets();
    return pets.filter((pet) => pet.estado === "en_casa").map((pet) => {
      const card = toStaticPublicPetCard(pet);
      return {
        publicCode: card.publicCode,
        name: card.name,
        species: card.species,
        breed: card.breed,
        status: card.status,
        zone: card.zone,
        photoUrl: card.photoUrl,
      };
    });
  }
  return supabaseDirectory().listPublicProfiles();
}

export async function findActivePublicProfile(publicCode: string): Promise<PublicProfile | null> {
  if (!hasSupabaseEnv()) {
    if (!allowsStaticDevelopmentDirectory()) throw new Error("El perfil público requiere una conexión activa con Supabase.");
    return null;
  }
  return supabaseDirectory().findPublicProfile(publicCode);
}
