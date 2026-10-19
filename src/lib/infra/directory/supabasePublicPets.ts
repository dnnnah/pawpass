import type { PublicPetDirectory } from "@/lib/domain/directory/types";
import { toPublicPetCard } from "@/lib/mapping/publicPet";

type SupabaseRpcError = {
  message?: string;
  code?: string;
};

export type PublicPetRpcClient = {
  rpc(
    functionName: "obtener_ficha_publica",
    args: { p_codigo: string },
  ): PromiseLike<{ data: unknown; error: SupabaseRpcError | null }>;
};

export class SupabasePublicPetDirectoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabasePublicPetDirectoryError";
  }
}

function unwrapRpcData(data: unknown): unknown {
  // PostgREST returns the jsonb value directly. The array branch keeps the
  // adapter tolerant of clients that wrap a single RPC row in an array.
  return Array.isArray(data) && data.length === 1 ? data[0] : data;
}

/**
 * Directory adapter for the anonymous QR contract.
 *
 * The database function is the privacy boundary: it returns only the fields
 * needed by `PublicPetCard`. The mapper applies the same boundary once more so
 * a future SQL change cannot accidentally widen what reaches the UI.
 */
export function createSupabasePublicPetDirectory(client: PublicPetRpcClient): PublicPetDirectory {
  return {
    async findPublicPet(publicCode) {
      const normalized = publicCode.trim();
      if (!normalized) return null;

      const { data, error } = await client.rpc("obtener_ficha_publica", {
        p_codigo: normalized,
      });

      if (error) {
        throw new SupabasePublicPetDirectoryError(
          error.message ?? "No se pudo consultar la ficha pública en Supabase.",
        );
      }

      return toPublicPetCard(unwrapRpcData(data));
    },
  };
}
