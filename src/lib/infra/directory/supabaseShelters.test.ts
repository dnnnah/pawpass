import { describe, expect, it, vi } from "vitest";
import { createSupabaseShelterDirectory, SupabaseShelterDirectoryError } from "./supabaseShelters";

const PUBLIC_SHELTER = {
  id: "refugio-patitas",
  nombre: "Patitas",
  descripcion: "Rescate local",
  ubicacion: "Zona Centro",
  contacto: { nombreResponsable: "", telefono: "", whatsapp: "", email: null },
  redes: ["https://example.com/patitas"],
  logoUrl: null,
  mascotas: ["mila"],
  verificado: true,
};

describe("supabaseShelterDirectory", () => {
  it("reads and normalizes only public shelter data", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [PUBLIC_SHELTER], error: null });
    await expect(createSupabaseShelterDirectory({ rpc }).listShelters()).resolves.toEqual([
      {
        ...PUBLIC_SHELTER,
        contacto: { nombreResponsable: "", telefono: "", whatsapp: "", email: null },
      },
    ]);
    expect(rpc).toHaveBeenCalledWith("listar_refugios_publicos", { p_limite: 100, p_offset: 0 });
  });

  it("discards incomplete or untrusted rows", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ ...PUBLIC_SHELTER, contacto: { ...PUBLIC_SHELTER.contacto, email: "bad" } }, PUBLIC_SHELTER],
      error: null,
    });
    await expect(createSupabaseShelterDirectory({ rpc }).listShelters()).resolves.toHaveLength(1);
  });

  it("preserves RPC failures for the service layer", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "offline" } });
    await expect(createSupabaseShelterDirectory({ rpc }).listShelters()).rejects.toBeInstanceOf(
      SupabaseShelterDirectoryError,
    );
  });
});
