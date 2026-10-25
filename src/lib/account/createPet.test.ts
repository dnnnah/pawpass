import { describe, expect, it, vi } from "vitest";
import { buildPetQrUrl, createAccountPet, uploadAccountPetPhoto, validateCreatePetInput } from "./createPet";

describe("validateCreatePetInput", () => {
  it("acepta una mascota con nombre, especie, fecha, contacto y foto", () => {
    expect(
      validateCreatePetInput({
        name: " Nala ",
        species: "gato",
        birthDate: "2022-04-12",
        contactMethod: "phone",
        contactValue: "+525512345678",
        photo: new File(["foto"], "nala.webp", { type: "image/webp" }),
      }),
    ).toEqual({});
  });

  it("requiere la fecha de nacimiento", () => {
    expect(validateCreatePetInput({
      name: "Nala",
      species: "gato",
      birthDate: "",
      contactMethod: "phone",
      contactValue: "+525512345678",
      photo: new File(["foto"], "nala.webp", { type: "image/webp" }),
    })).toEqual({ birthDate: "Escribe la fecha de nacimiento." });
  });

  it("rechaza nombre vacío, especie desconocida y fecha futura", () => {
    expect(
      validateCreatePetInput({
        name: "  ",
        species: "ave",
        birthDate: "2999-01-01",
        contactMethod: "email",
        contactValue: "correo-invalido",
        photo: new File(["foto"], "nala.gif", { type: "image/gif" }),
      }),
    ).toEqual({
      name: "Escribe el nombre de tu mascota.",
      species: "Selecciona perro o gato.",
      birthDate: "La fecha no puede estar en el futuro.",
      contactValue: "Escribe un correo válido.",
      photo: "La foto debe ser JPEG, PNG o WebP y pesar hasta 5 MiB.",
    });
  });

  it("requiere fecha real, contacto seleccionado y foto dentro del límite", () => {
    expect(validateCreatePetInput({
      name: "Nala",
      species: "gato",
      birthDate: "2024-02-31",
      contactMethod: "whatsapp",
      contactValue: "123",
      photo: new File([new Uint8Array(5 * 1024 * 1024 + 1)], "grande.png", { type: "image/png" }),
    })).toMatchObject({
      birthDate: "Escribe una fecha válida.",
      contactValue: "Escribe un teléfono válido con código de país o 10 a 15 dígitos.",
      photo: "La foto debe ser JPEG, PNG o WebP y pesar hasta 5 MiB.",
    });
  });
});

describe("createAccountPet", () => {
  it("llama la RPC con los campos normalizados y devuelve el id", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { petId: "pet-123", documentId: "doc-123", objectPath: "doc-123/archivo", publicCode: "PC-ABC-001" },
      error: null,
    });

    await expect(
      createAccountPet(
        { rpc },
        { name: "  Nala  ", species: "gato", birthDate: "2022-04-12", contactMethod: "email", contactValue: "ana@example.com", photo: new File(["foto"], "nala.png", { type: "image/png" }) },
      ),
    ).resolves.toEqual({ id: "pet-123", documentId: "doc-123", objectPath: "doc-123/archivo", publicCode: "PC-ABC-001", error: null });

    expect(rpc).toHaveBeenCalledWith("crear_mascota", {
      p_nombre: "Nala",
      p_especie: "gato",
      p_nacimiento: "2022-04-12",
      p_medio_contacto: "email",
      p_valor_contacto: "ana@example.com",
      p_foto_nombre: "nala.png",
      p_foto_mime: "image/png",
      p_foto_tamano: 4,
    });
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("p_user_id");
  });

  it("convierte el error de Supabase en un resultado utilizable por el formulario", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "name must not be empty" },
    });

    await expect(
      createAccountPet(
        { rpc },
        { name: "Nala", species: "gato", birthDate: "", contactMethod: "email", contactValue: "ana@example.com", photo: new File(["foto"], "nala.png", { type: "image/png" }) },
      ),
    ).resolves.toEqual({
      id: null,
      documentId: null,
      objectPath: null,
      publicCode: null,
      error: "No pudimos registrar la mascota. Revisa los datos e intenta de nuevo.",
    });
  });

  it("permite reintentar la foto con la misma ruta ya registrada", async () => {
    const upload = vi.fn().mockResolvedValueOnce({ error: { message: "network" } }).mockResolvedValueOnce({ error: null });
    const photo = new File(["foto"], "nala.png", { type: "image/png" });
    const result = { objectPath: "doc-123/archivo" };

    await expect(uploadAccountPetPhoto({ upload }, result, photo)).resolves.toContain("no pudimos subir la foto");
    await expect(uploadAccountPetPhoto({ upload }, result, photo)).resolves.toBeNull();
    expect(upload).toHaveBeenNthCalledWith(1, "doc-123/archivo", photo);
    expect(upload).toHaveBeenNthCalledWith(2, "doc-123/archivo", photo);
  });
});

describe("buildPetQrUrl", () => {
  it("prepara una URL QR canónica sin publicar ni cambiar el código", () => {
    expect(buildPetQrUrl("PC-ABC-001", "https://pawpass.example")).toBe("https://pawpass.example/p/PC-ABC-001");
    expect(buildPetQrUrl("a b", "https://pawpass.example")).toBe("https://pawpass.example/p/a%20b");
  });
});
