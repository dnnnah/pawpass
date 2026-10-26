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
    expect(html).toContain('href="/cuenta/mascotas/EnCasa"');
    expect(html).toContain("Abrir carnet privado");
    expect(html).not.toContain("Administrar mascota");
  });
  it("no ofrece eliminar una mascota a un tutor sin administración", () => {
    const html = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [pet("Compartida", "en_casa", "tutor")], error: null }));
    expect(html).toContain("Abrir carnet privado");
    expect(html).not.toContain("Eliminar a Compartida");
  });
  it("mantiene cerrado el registro hasta que la persona decide abrirlo", () => {
    const html = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [pet("Nala", "en_casa")], error: null }));
    const registration = html.match(/<details id="agregar-mascota"[^>]*>[\s\S]*?<\/details>/)?.[0];

    expect(registration).toContain("Registrar nueva mascota");
    expect(registration).not.toMatch(/<details[^>]*\bopen(?:="")?[^>]*>/);
    expect(html.match(/Registrar nueva mascota/g)).toHaveLength(1);
    expect(html).not.toContain("Registrar mi primera mascota");
  });
});
