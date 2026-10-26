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
  contactMethod: "phone",
  zone: "San Buenaventura",
  emergencyCareNote: "No ofrecer pollo.",
  vaccinationStatus: "sin_informacion",
  photoPath: "photo-id/archivo",
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
  contact: { name: "Donnovan", phone: "5512345678", whatsapp: "5215512345678", email: "privado@example.com" },
  recentPhotoPaths: ["extra-id/archivo"],
};

describe("createSupabasePublicPetDirectory", () => {
  it("consulta el RPC con el código normalizado y mapea su respuesta", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [payload], error: null });
    const createSignedUrl = vi.fn(async (path: string) => ({ data: { signedUrl: `https://storage.test/${path}` }, error: null }));
    const directory = createSupabasePublicPetDirectory({ rpc, storage: { from: () => ({ createSignedUrl }) } });

    await expect(directory.findPublicPet("  PC-LUCCA-001 ")).resolves.toMatchObject({
      publicCode: "PC-LUCCA-001",
      name: "Lucca",
      contact: { name: "Donnovan", phone: "5512345678", whatsapp: null },
      zone: "San Buenaventura",
      emergencyCareNote: "No ofrecer pollo.",
      vaccinationStatus: "sin_informacion",
      photoUrl: "https://storage.test/photo-id/archivo",
      recentPhotos: [{ url: "https://storage.test/extra-id/archivo" }],
    });
    expect(rpc).toHaveBeenCalledWith("obtener_ficha_publica", { p_codigo: "PC-LUCCA-001" });
    expect(createSignedUrl).toHaveBeenCalledTimes(2);
  });

  it("devuelve null para una respuesta vacía o un código vacío", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const directory = createSupabasePublicPetDirectory({ rpc });

    await expect(directory.findPublicPet("PC-NO-EXISTE-999")).resolves.toBeNull();
    await expect(directory.findPublicPet("   ")).resolves.toBeNull();
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("lista solo fichas que el mapper confirma como perdidas", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [payload, { ...payload, status: "en_casa", lost: null }], error: null });
    const directory = createSupabasePublicPetDirectory({ rpc });

    await expect(directory.listLostPets()).resolves.toHaveLength(1);
    expect(rpc).toHaveBeenCalledWith("listar_mascotas_perdidas", { p_limite: 50, p_offset: 0 });
  });

  it("lista perfiles voluntarios mediante un RPC separado del catálogo de adopción", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ publicCode: "PC-LOLA-123", name: "Lola", species: "Perro", status: "en_casa", photoPath: "lola/main" }],
      error: null,
    });
    const directory = createSupabasePublicPetDirectory({ rpc });

    await expect(directory.listPublicProfiles()).resolves.toEqual([
      { publicCode: "PC-LOLA-123", name: "Lola", species: "Perro", photoUrl: null, breed: null, status: "en_casa", zone: null },
    ]);
    expect(rpc).toHaveBeenCalledWith("listar_perfiles_publicos", { p_limite: 50, p_offset: 0 });
  });

  it("lee el perfil voluntario con su lista allowlisted y firma solo sus archivos publicados", async () => {
    const publicProfile = {
      publicCode: "PC-LOLA-123", name: "Lola", species: "Perro", status: "en_casa",
      photoPath: "lola/main", photos: [{ visible: true, path: "lola/selected-photo" }],
      contact: { name: null, phone: "+525512345678", whatsapp: null, email: null },
      health: { allergies: ["Pollo"], conditions: [], medications: [], diet: "Croquetas especiales", behavior: "Tranquila" },
      vaccines: [{ visible: true, name: "Rabia", applicationDate: "2025-05-01", nextDose: "2026-05-01" }],
      documents: [{ visible: true, name: "Cartilla", type: "pdf", category: "vacunas", bucket: "pawpass-documentos", path: "lola/cartilla" }],
      veterinarian: { name: "No debe llegar a la página" },
    };
    const rpc = vi.fn().mockResolvedValue({ data: publicProfile, error: null });
    const createSignedUrl = vi.fn(async (path: string) => ({ data: { signedUrl: `https://storage.test/${path}` }, error: null }));
    const directory = createSupabasePublicPetDirectory({ rpc, storage: { from: () => ({ createSignedUrl }) } });

    await expect(directory.findPublicProfile("PC-LOLA-123")).resolves.toMatchObject({
      publicCode: "PC-LOLA-123", name: "Lola", contact: { phone: "+525512345678" },
      health: { allergies: ["Pollo"] }, photos: [{ url: "https://storage.test/lola/selected-photo" }],
      documents: [{ name: "Cartilla", url: "https://storage.test/lola/cartilla" }],
    });
    expect(rpc).toHaveBeenCalledWith("obtener_perfil_publico", { p_codigo: "PC-LOLA-123" });
    expect(createSignedUrl).toHaveBeenCalledTimes(3);
  });

  it("conserva la foto pública histórica que el RPC devuelve cuando falta el objeto de Storage", async () => {
    const publicProfile = {
      publicCode: "PC-LUCCA-001",
      name: "Lucca",
      species: "Perro",
      status: "en_casa",
      photoPath: null,
      photoUrl: "/pets/lucca.jpeg",
      contact: {},
      vaccines: [],
      photos: [],
      documents: [],
    };
    const rpc = vi.fn().mockResolvedValue({ data: publicProfile, error: null });
    const directory = createSupabasePublicPetDirectory({ rpc });

    await expect(directory.findPublicProfile("PC-LUCCA-001")).resolves.toMatchObject({
      publicCode: "PC-LUCCA-001",
      photoUrl: "/pets/lucca.jpeg",
    });

    const mismatchedRpc = vi.fn().mockResolvedValue({
      data: { ...publicProfile, publicCode: "PC-NIKO-002" },
      error: null,
    });
    const mismatchedDirectory = createSupabasePublicPetDirectory({ rpc: mismatchedRpc });
    await expect(mismatchedDirectory.findPublicProfile("PC-NIKO-002")).resolves.toMatchObject({
      publicCode: "PC-NIKO-002",
      photoUrl: null,
    });
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
