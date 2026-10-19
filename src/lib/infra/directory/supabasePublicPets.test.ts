import { describe, expect, it, vi } from "vitest";
import {
  createSupabasePublicPetDirectory,
  SupabasePublicPetDirectoryError,
} from "@/lib/infra/directory/supabasePublicPets";

const payload = {
  publicCode: "PC-LUCCA-001",
  photoUrl: null,
  name: "Lucca",
  species: "Perro",
  breed: "Schnauzer",
  status: "perdido",
  privacy: {
    mostrarNombreContacto: true,
    mostrarTelefono: true,
    mostrarWhatsapp: false,
    mostrarZona: true,
    mostrarEmergencia: true,
  },
  lost: {
    zona: "San Buenaventura",
    fechaPerdida: "2026-10-19",
    mensaje: "Avísame si lo ves",
    instrucciones: ["No lo persigas"],
  },
  contact: { name: "Donnovan", phone: "5512345678", whatsapp: null },
  recentPhotos: [],
};

describe("createSupabasePublicPetDirectory", () => {
  it("consulta el RPC con el código normalizado y mapea su respuesta", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [payload], error: null });
    const directory = createSupabasePublicPetDirectory({ rpc });

    await expect(directory.findPublicPet("  PC-LUCCA-001 ")).resolves.toMatchObject({
      publicCode: "PC-LUCCA-001",
      name: "Lucca",
      contact: { name: "Donnovan", phone: "5512345678", whatsapp: null },
    });
    expect(rpc).toHaveBeenCalledWith("obtener_ficha_publica", { p_codigo: "PC-LUCCA-001" });
  });

  it("devuelve null para una respuesta vacía o un código vacío", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const directory = createSupabasePublicPetDirectory({ rpc });

    await expect(directory.findPublicPet("PC-NO-EXISTE-999")).resolves.toBeNull();
    await expect(directory.findPublicPet("   ")).resolves.toBeNull();
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("convierte los errores del RPC en un error del adaptador", async () => {
    const directory = createSupabasePublicPetDirectory({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "RPC unavailable" } }),
    });

    await expect(directory.findPublicPet("PC-LUCCA-001")).rejects.toBeInstanceOf(
      SupabasePublicPetDirectoryError,
    );
  });
});
