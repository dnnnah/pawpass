import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountPet } from "@/lib/account/pets";
import { AccountPetsDashboard } from "./AccountPetsDashboard";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

function pet(name: string, status: AccountPet["status"], role = "administrador"): AccountPet {
  return { id: name, name, status, species: "perro", publicCode: name, slug: null, breed: null, role, startedAt: "2026-10-25T12:00:00Z" };
}

describe("organización de mis mascotas", () => {
  it("muestra las alertas en rojo antes de las demás y el registro después de las tarjetas", () => {
    const html = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [pet("EnCasa", "en_casa"), pet("EnAlerta", "perdido")], error: null }));
    expect(html.indexOf("EnAlerta")).toBeLessThan(html.indexOf("EnCasa"));
    expect(html.slice(html.indexOf("<article"), html.indexOf("EnAlerta"))).toContain("bg-danger-soft");
    expect(html).toContain("Alerta activa");
    expect(html.indexOf('id="agregar-mascota"')).toBeGreaterThan(html.indexOf("EnCasa"));
    expect(html).toContain('href="/perdidas"');
  });
  it("no ofrece eliminar una mascota a un tutor sin administración", () => {
    const html = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [pet("Compartida", "en_casa", "tutor")], error: null }));
    expect(html).toContain("Abrir carnet privado");
    expect(html).not.toContain("Eliminar a Compartida");
  });
});
