export type StoredPetFile = { bucket: string; path: string };
export type PetDeletionDependencies = {
  getRole: (petId: string) => Promise<string | null>;
  listFiles: (petId: string) => Promise<StoredPetFile[]>;
  removeFiles: (bucket: string, paths: string[]) => Promise<void>;
  deletePet: (petId: string) => Promise<boolean>;
};

export type DeletionResult = { ok: true } | { ok: false; status: number; error: string };

export function validDeletionConfirmation(value: unknown): boolean {
  return typeof value === "object" && value !== null && "confirmation" in value && value.confirmation === "ELIMINAR";
}

export function sameRequestOrigin(requestUrl: string, origin: string | null): boolean {
  if (!origin) return false;
  try { return new URL(requestUrl).origin === origin; } catch { return false; }
}

/** Authenticate and authorize before touching Storage; metadata stays until cleanup succeeds. */
export async function deleteOwnedPet(deps: PetDeletionDependencies, petId: string): Promise<DeletionResult> {
  try {
    if (await deps.getRole(petId) !== "administrador") return { ok: false, status: 403, error: "Solo la persona administradora puede eliminar esta mascota." };
    const files = await deps.listFiles(petId);
    const byBucket = new Map<string, string[]>();
    for (const file of files) {
      if (!["pawpass-fotos", "pawpass-documentos"].includes(file.bucket) || !file.path.startsWith(`${petId}/`) || file.path.split("/").some(part => part === ".." || part === ".")) {
        return { ok: false, status: 409, error: "No pudimos verificar los archivos de la mascota. No se eliminó el registro." };
      }
      const paths = byBucket.get(file.bucket) ?? [];
      paths.push(file.path);
      byBucket.set(file.bucket, paths);
    }
    for (const [bucket, paths] of byBucket) await deps.removeFiles(bucket, paths);
    if (!await deps.deletePet(petId)) return { ok: false, status: 409, error: "No pudimos eliminar el registro. Recarga la página e intenta de nuevo." };
    return { ok: true };
  } catch {
    return { ok: false, status: 503, error: "No pudimos completar la eliminación. Intenta de nuevo; no se ha confirmado la eliminación del registro." };
  }
}
