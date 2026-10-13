/**
 * API de consulta de mascotas (FASE 9A).
 *
 * Punto de entrada único para rutas y componentes. Compone el puerto
 * `PetDirectory` y es lo ÚNICO que hay que tocar para cambiar la fuente de
 * datos (hoy `staticPetDirectory`, mañana un adapter Supabase).
 *
 * Sin dependencias de React, Next.js, Supabase ni del sistema de archivos:
 * esta capa es intercambiable y testeable en node.
 */

import type { PetDirectory } from "@/lib/domain/directory/types";
import { staticPetDirectory } from "@/lib/infra/directory/staticPets";
import type { PetProfile } from "@/types/pet";

/**
 * Fuente activa del catálogo. Sustituir aquí es el único punto de cambio
 * necesario para migrar de datos estáticos a Supabase.
 */
const directory: PetDirectory = staticPetDirectory;

/** Mascotas con perfil propio en la fuente de datos. */
export async function getAllPets(): Promise<PetProfile[]> {
  return directory.listProfilePets();
}

/** Resuelve una mascota con perfil por `id` o por `codigoPublico`. `null` si no existe. */
export async function getPetById(id: string): Promise<PetProfile | null> {
  return directory.findProfilePet(id);
}

/** Mascotas del catálogo de adopción del prototipo. */
export async function getAdoptionDemoPets(): Promise<PetProfile[]> {
  return directory.listAdoptionPets();
}

/** Todas las mascotas navegables: perfiles propios + catálogo de adopción. */
export async function getAllProfilePets(): Promise<PetProfile[]> {
  const [profiles, adoption] = await Promise.all([getAllPets(), getAdoptionDemoPets()]);

  return [...profiles, ...adoption];
}

/**
 * Resuelve cualquier mascota por `id` o `codigoPublico`, buscando primero en
 * los perfiles propios y después en el catálogo de adopción.
 * `null` si no existe en ninguna fuente.
 */
export async function getPetByIdAny(id: string): Promise<PetProfile | null> {
  return (await getPetById(id)) ?? directory.findAdoptionPet(id);
}
