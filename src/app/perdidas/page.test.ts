import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LostPetsPage from "./page";
import { getAccountPets } from "@/app/cuenta/accountData";
import { loadPublicLostPets } from "@/app/lostDirectory";

vi.mock("@/app/cuenta/accountData", () => ({ getAccountPets: vi.fn() }));
vi.mock("@/app/lostDirectory", () => ({ loadPublicLostPets: vi.fn() }));
vi.mock("@/components/layout/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => createElement("main", null, children) }));
vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props) }));

describe("acceso al carnet desde alertas propias", () => {
  it("enlaza el carnet privado sin repetir el botón de administrar mascotas", async () => {
    vi.mocked(getAccountPets).mockResolvedValue({
      authenticated: true,
      pets: [{ id: "pet-1", publicCode: "PC-NALA-001", name: "Nala", status: "perdido", species: "perro", slug: null, breed: null, role: "administrador", startedAt: "2026-10-26T00:00:00Z" }],
      error: null,
    });
    vi.mocked(loadPublicLostPets).mockResolvedValue({ pets: [], error: null });

    const html = renderToStaticMarkup(await LostPetsPage());

    expect(html).toContain('href="/cuenta/mascotas/pet-1"');
    expect(html).toContain("Abrir carnet privado");
    expect(html).toContain('href="/p/PC-NALA-001"');
    expect(html).toContain("Ver ficha pública");
    expect(html).not.toContain("Administrar mascota");
  });

  it("da acceso a la ficha pública QR desde la alerta propia", async () => {
    vi.mocked(getAccountPets).mockResolvedValue({
      authenticated: true,
      pets: [{ id: "pet-2", publicCode: "PC-BRUNO-001", name: "Bruno", status: "perdido", species: "perro", slug: null, breed: null, role: "administrador", startedAt: "2026-10-26T00:00:00Z" }],
      error: null,
    });
    vi.mocked(loadPublicLostPets).mockResolvedValue({ pets: [], error: null });

    const html = renderToStaticMarkup(await LostPetsPage());

    expect(html).toContain('href="/p/PC-BRUNO-001"');
    expect(html).toContain("Ver ficha pública");
  });
});
