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
  it("muestra las alertas en rojo y mantiene el registro por encima de las tarjetas", () => {
    const html = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [pet("EnCasa", "en_casa"), pet("EnAlerta", "perdido")], error: null }));
    expect(html.indexOf("EnAlerta")).toBeLessThan(html.indexOf("EnCasa"));
    expect(html.slice(html.indexOf("<article"), html.indexOf("EnAlerta"))).toContain("bg-danger-soft");
    expect(html).toContain("Alerta activa");
    expect(html).toContain('href="/p/EnAlerta"');
    expect(html).toContain("Ver ficha pública");
    expect(html.indexOf('id="agregar-mascota"')).toBeLessThan(html.indexOf("EnCasa"));
    expect(html).toContain('href="/cuenta/mascotas/EnCasa"');
    expect(html).toContain("Abrir carnet privado");
    expect(html).not.toContain("Administrar mascota");
  });
  it("presenta el registro antes de las tarjetas, también cuando no hay mascotas", () => {
    const populated = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [pet("Nala", "en_casa")], error: null }));
    expect(populated.indexOf("Registrar nueva mascota")).toBeLessThan(populated.indexOf("<article"));
    const empty = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [], error: null }));
    expect(empty.indexOf("Registrar nueva mascota")).toBeLessThan(empty.indexOf("Aún no tienes mascotas"));
  });
  it("mantiene la acción de adopción visible en la tarjeta sin un panel colapsado", () => {
    const html = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [pet("Nala", "en_casa")], error: null }));
    expect(html).toContain("Publicar en adopción");
    expect(html).not.toContain("<summary class=\"cursor-pointer text-sm font-semibold text-ink\">Adopción</summary>");
  });
  it("no ofrece eliminar una mascota a un tutor sin administración", () => {
    const html = renderToStaticMarkup(createElement(AccountPetsDashboard, { pets: [pet("Compartida", "en_casa", "tutor")], error: null }));
    expect(html).toContain("Abrir carnet privado");
    expect(html).not.toContain("Eliminar a Compartida");
  });
  it("permite que cualquier tutor vea la ficha pública de una mascota perdida", () => {
    const html = renderToStaticMarkup(createElement(AccountPetsDashboard, {
      pets: [{ ...pet("Compartida", "perdido", "tutor"), publicCode: "PC-COMPARTIDA-9" }], error: null,
    }));
    expect(html).toContain('href="/p/PC-COMPARTIDA-9"');
    expect(html).toContain("Ver ficha pública");
  });
  it("acerca las acciones del perfil voluntario a las acciones principales de la mascota", () => {
    const active = renderToStaticMarkup(createElement(AccountPetsDashboard, {
      pets: [{ ...pet("Luna", "en_casa"), publicProfilePublished: true }], error: null,
    }));
    expect(active).toContain('href="/perfil/Luna"');
    expect(active).toContain("Perfil público voluntario activo");
    expect(active).toContain("Compartir perfil");
    expect(active).not.toContain('href="/p/Luna"');

    const inactive = renderToStaticMarkup(createElement(AccountPetsDashboard, {
      pets: [{ ...pet("Luna", "en_casa"), publicProfilePublished: false }], error: null,
    }));
    expect(inactive).toContain('href="/cuenta/mascotas/Luna#perfil-publico"');
    expect(inactive).toContain("Configurar perfil público");
    expect(inactive).not.toContain('href="/perfil/Luna"');
    expect(inactive).not.toContain("Compartir perfil");

    const unknown = renderToStaticMarkup(createElement(AccountPetsDashboard, {
      pets: [{ ...pet("Luna", "en_casa") }], error: null,
    }));
    expect(unknown).toContain("Estado del perfil público por revisar");
    expect(unknown).not.toContain("Perfil público voluntario inactivo");
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
