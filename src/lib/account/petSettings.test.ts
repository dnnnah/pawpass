import { describe, expect, it, vi } from "vitest";
import {
  loadPetSettings,
  normalizePetContact,
  normalizePetPrivacy,
  updatePetContact,
  updatePetPrivacy,
  validateQrContact,
  type PetSettingsClient,
} from "./petSettings";

function makeClient() {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  const from = vi.fn((table: string) => ({
    table,
    update,
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  }));

  return { client: { from } as unknown as PetSettingsClient, from, update };
}

describe("normalizePetContact", () => {
  it("limpia texto y representa campos nulos como vacíos", () => {
    expect(
      normalizePetContact({
        nombre_publico: "  Ana  ",
        telefono_principal: null,
        whatsapp: " +525500000000 ",
        telefono_secundario: "",
        email: " ana@example.com ",
        zona_segura: null,
        zona_habitual: "  Parque  ",
        mensaje_whatsapp: null,
        medio_contacto_qr: "whatsapp",
      }),
    ).toEqual({
      contactMethod: "whatsapp",
      publicName: "Ana",
      phone: "",
      whatsapp: "+525500000000",
      secondaryPhone: "",
      email: "ana@example.com",
      safeZone: "",
      usualZone: "Parque",
      whatsappMessage: "",
    });
  });

  it("infiere solo cuando no hay columna y no elige un canal ambiguo de un registro existente", () => {
    const contact = normalizePetContact({ telefono_principal: "525500000000" });
    expect(contact.contactMethod).toBe("phone");
    expect(validateQrContact(contact)).toBeNull();
    expect(normalizePetContact({ telefono_principal: "525500000000", whatsapp: "5215550000000", medio_contacto_qr: null }).contactMethod).toBe("");
    expect(validateQrContact({ ...contact, contactMethod: "email" })).toBeTruthy();
  });
});

describe("normalizePetPrivacy", () => {
  it("aplica false a banderas ausentes y conserva las consentidas", () => {
    expect(normalizePetPrivacy({ publicado: true, mostrar_telefono: true })).toMatchObject({
      published: true,
      showPhone: true,
      showWhatsapp: false,
      showHealth: false,
    });
  });
});

describe("loadPetSettings", () => {
  it("lee contacto y privacidad para una mascota", async () => {
    const contactQuery = {
      maybeSingle: vi.fn().mockResolvedValue({
        data: { nombre_publico: "Ana", telefono_principal: "525500000000" },
        error: null,
      }),
    };
    const privacyQuery = {
      maybeSingle: vi.fn().mockResolvedValue({
        data: { publicado: true, mostrar_telefono: true },
        error: null,
      }),
    };
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(contactQuery) }) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(privacyQuery) }) });

    await expect(loadPetSettings({ from } as unknown as PetSettingsClient, "pet-1")).resolves.toEqual({
      contact: expect.objectContaining({ publicName: "Ana", phone: "525500000000" }),
      privacy: expect.objectContaining({ published: true, showPhone: true }),
      error: null,
    });
  });
});

describe("updatePetContact y updatePetPrivacy", () => {
  it("actualizan cada tabla con el filtro de mascota", async () => {
    const { client, from, update } = makeClient();

    await expect(
      updatePetContact(client, "pet-1", {
        contactMethod: "phone",
        publicName: "Ana",
        phone: "525500000000",
        whatsapp: "",
        secondaryPhone: "",
        email: "",
        safeZone: "",
        usualZone: "Parque",
        whatsappMessage: "",
      }),
    ).resolves.toBeNull();

    await expect(
      updatePetPrivacy(client, "pet-1", {
        published: true,
        showContactName: true,
        showPhone: true,
        showWhatsapp: false,
        showSecondaryPhone: false,
        showEmail: false,
        showZone: false,
        showHealth: false,
        showVeterinarian: false,
        showVetAddress: false,
        showEmergency: true,
        showMicrochip: false,
        listInCatalog: false,
      }),
    ).resolves.toBeNull();

    expect(from).toHaveBeenNthCalledWith(1, "pet_contacts");
    expect(from).toHaveBeenNthCalledWith(2, "pet_privacy");
    expect(update).toHaveBeenNthCalledWith(1, expect.objectContaining({ nombre_publico: "Ana" }));
    expect(update).toHaveBeenNthCalledWith(2, expect.objectContaining({ publicado: true }));
  });
});
