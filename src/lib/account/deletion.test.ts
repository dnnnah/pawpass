import { describe, expect, it, vi } from "vitest";
import { deleteOwnedPet, sameRequestOrigin, validDeletionConfirmation, type PetDeletionDependencies } from "./deletion";

function dependencies(overrides: Partial<PetDeletionDependencies> = {}) {
  return {
    getRole: vi.fn().mockResolvedValue("administrador"),
    listFiles: vi.fn().mockResolvedValue([{ bucket: "pawpass-fotos", path: "pet-1/photo/archivo" }]),
    removeFiles: vi.fn().mockResolvedValue(undefined),
    deletePet: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("eliminación privada de mascotas", () => {
  it.each([null, "tutor"])("no toca archivos ni datos con rol %s", async (role) => {
    const deps = dependencies({ getRole: vi.fn().mockResolvedValue(role) });
    expect(await deleteOwnedPet(deps, "pet-1")).toMatchObject({ ok: false, status: 403 });
    expect(deps.listFiles).not.toHaveBeenCalled();
    expect(deps.deletePet).not.toHaveBeenCalled();
  });
  it("limpia Storage antes de eliminar el registro", async () => {
    const order: string[] = [];
    const deps = dependencies({ removeFiles: vi.fn(async () => { order.push("storage"); }), deletePet: vi.fn(async () => { order.push("pet"); return true; }) });
    expect(await deleteOwnedPet(deps, "pet-1")).toEqual({ ok: true });
    expect(order).toEqual(["storage", "pet"]);
  });
  it("elimina archivos almacenados bajo la raíz real de su documento", async () => {
    const docId = "a41c95a4-8140-49b4-85f3-d9149dbca1ce";
    const deps = dependencies({
      listFiles: vi.fn().mockResolvedValue([{ bucket: "pawpass-fotos", documentId: docId, path: `${docId}/foto.jpeg` }]),
    });
    expect(await deleteOwnedPet(deps, "pet-1")).toEqual({ ok: true });
    expect(deps.removeFiles).toHaveBeenCalledWith("pawpass-fotos", [`${docId}/foto.jpeg`]);
    expect(deps.deletePet).toHaveBeenCalledWith("pet-1");
  });
  it("conserva el registro si falla la limpieza", async () => {
    const deps = dependencies({ removeFiles: vi.fn().mockRejectedValue(new Error("storage unavailable")) });
    expect(await deleteOwnedPet(deps, "pet-1")).toMatchObject({ ok: false, status: 503 });
    expect(deps.deletePet).not.toHaveBeenCalled();
  });
  it.each([
    { bucket: "otro-bucket", path: "pet-1/photo" },
    { bucket: "pawpass-fotos", path: "otra-mascota/photo" },
    { bucket: "pawpass-fotos", path: "pet-1/../otra-mascota/photo" },
  ])("rechaza archivos fuera del ámbito de la mascota", async (file) => {
    const deps = dependencies({ listFiles: vi.fn().mockResolvedValue([file]) });
    expect(await deleteOwnedPet(deps, "pet-1")).toMatchObject({ ok: false, status: 409 });
    expect(deps.removeFiles).not.toHaveBeenCalled();
  });
  it("no confirma una eliminación que RLS no ejecutó", async () => {
    expect(await deleteOwnedPet(dependencies({ deletePet: vi.fn().mockResolvedValue(false) }), "pet-1")).toMatchObject({ ok: false, status: 409 });
  });
});

describe("confirmación y origen de eliminaciones", () => {
  it("requiere la confirmación explícita", () => {
    expect(validDeletionConfirmation({ confirmation: "ELIMINAR" })).toBe(true);
    for (const value of [null, {}, { confirmation: "eliminar" }, { confirmation: true }]) expect(validDeletionConfirmation(value)).toBe(false);
  });
  it("rechaza peticiones desde otros sitios y sin origen", () => {
    expect(sameRequestOrigin("https://pet-carnet.vercel.app/api/cuenta", "https://pet-carnet.vercel.app")).toBe(true);
    expect(sameRequestOrigin("https://pet-carnet.vercel.app/api/cuenta", "https://otro.test")).toBe(false);
    expect(sameRequestOrigin("https://pet-carnet.vercel.app/api/cuenta", null)).toBe(false);
  });
});
