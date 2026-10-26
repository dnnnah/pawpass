export type StoredPetFile = { bucket: string; path: string; documentId?: string };
export type PetDeletionDependencies = {
  getRole: (petId: string) => Promise<string | null>;
  listFiles: (petId: string) => Promise<StoredPetFile[]>;
  removeFiles: (bucket: string, paths: string[]) => Promise<void>;
  deletePet: (petId: string) => Promise<boolean>;
};

export type AccountDeletionDependencies = Omit<PetDeletionDependencies, "getRole"> & {
  deleteUser: (userId: string) => Promise<boolean>;
};

export type DeletionResult = { ok: true } | { ok: false; status: number; error: string };

export function validDeletionConfirmation(value: unknown, phrase = "ELIMINAR", requireLinkedPetsAcknowledgement = false): boolean {
  if (typeof value !== "object" || value === null || !("confirmation" in value) || value.confirmation !== phrase) return false;
  return !requireLinkedPetsAcknowledgement || ("deleteLinkedPetsForever" in value && value.deleteLinkedPetsForever === true);
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
      const parts = file.path.split("/");
      const expectedRoot = file.documentId || petId;
      if (!["pawpass-fotos", "pawpass-documentos"].includes(file.bucket)
        || parts.length < 2
        || parts[0] !== expectedRoot
        || parts.some(part => !part || part === ".." || part === ".")) {
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

/** Removes every active pet attached to an account, its stored files, then the account itself. */
export async function deleteAccountWithPets(deps: AccountDeletionDependencies, userId: string, petIds: string[]): Promise<DeletionResult> {
  try {
    const uniquePetIds = [...new Set(petIds)];
    const filesByPet = new Map<string, StoredPetFile[]>();

    // Validate every file path before removing any file or database record.
    for (const petId of uniquePetIds) {
      const files = await deps.listFiles(petId);
      for (const file of files) {
        const parts = file.path.split("/");
        const expectedRoot = file.documentId || petId;
        if (!["pawpass-fotos", "pawpass-documentos"].includes(file.bucket)
          || parts.length < 2
          || parts[0] !== expectedRoot
          || parts.some((part) => !part || part === ".." || part === ".")) {
          return { ok: false, status: 409, error: "No pudimos verificar todos los archivos de la cuenta. No se eliminó ningún registro." };
        }
      }
      filesByPet.set(petId, files);
    }

    for (const petId of uniquePetIds) {
      const byBucket = new Map<string, string[]>();
      for (const file of filesByPet.get(petId) ?? []) {
        const paths = byBucket.get(file.bucket) ?? [];
        paths.push(file.path);
        byBucket.set(file.bucket, paths);
      }
      for (const [bucket, paths] of byBucket) await deps.removeFiles(bucket, paths);
    }

    for (const petId of uniquePetIds) {
      if (!await deps.deletePet(petId)) {
        return { ok: false, status: 503, error: "No pudimos terminar de borrar las mascotas vinculadas. Tu cuenta sigue activa; vuelve a intentarlo para completar la limpieza." };
      }
    }

    if (!await deps.deleteUser(userId)) {
      return { ok: false, status: 503, error: "Las mascotas y sus archivos ya se borraron, pero no pudimos eliminar la cuenta. Vuelve a intentarlo para completar el proceso." };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 503, error: "No pudimos completar la limpieza de la cuenta y sus mascotas. Tu cuenta sigue activa; vuelve a intentarlo." };
  }
}
