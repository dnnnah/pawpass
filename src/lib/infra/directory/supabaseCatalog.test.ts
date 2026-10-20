import { describe, expect, it, vi } from "vitest";
import {
  createSupabaseAdoptionCatalog,
  SupabaseAdoptionCatalogError,
} from "./supabaseCatalog";

const VALID_ENTRY = {
  petId: "mila",
  codigoPublico: "PC-MILA-001",
  nombre: "Mila",
  especie: "Perro",
  raza: "Mestizo",
  genero: "Hembra",
  talla: "Mediano",
  fechaNacimiento: "2021-03-15",
  fotoUrl: "",
  zona: "Colonia Roma Norte, Ciudad de México",
  verificado: true,
  shelterId: "shelter-1",
  shelterNombre: "Patitas con Causa",
};

describe("createSupabaseAdoptionCatalog", () => {
  it("consulta el RPC público y normaliza sus entradas", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [VALID_ENTRY], error: null });

    await expect(createSupabaseAdoptionCatalog({ rpc }).listAdoptionCatalog()).resolves.toEqual([
      VALID_ENTRY,
    ]);
    expect(rpc).toHaveBeenCalledWith("listar_catalogo_publico", {
      p_limite: 100,
      p_offset: 0,
    });
  });

  it("tolera el arreglo envuelto que devuelven algunos clientes RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [ [VALID_ENTRY] ], error: null });

    await expect(createSupabaseAdoptionCatalog({ rpc }).listAdoptionCatalog()).resolves.toHaveLength(1);
  });

  it("descarta filas incompletas para no pintar tarjetas inseguras", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ ...VALID_ENTRY, genero: "" }, VALID_ENTRY],
      error: null,
    });

    await expect(createSupabaseAdoptionCatalog({ rpc }).listAdoptionCatalog()).resolves.toEqual([
      VALID_ENTRY,
    ]);
  });

  it("conserva un error de adapter para que la capa de servicio pueda decidir el fallback", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "permission denied" },
    });

    await expect(createSupabaseAdoptionCatalog({ rpc }).listAdoptionCatalog()).rejects.toBeInstanceOf(
      SupabaseAdoptionCatalogError,
    );
  });
});
