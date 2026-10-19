import { describe, expect, it } from "vitest";
import {
  INSTALL_CTA_COPY,
  LOST_MODE_LOCAL_COPY,
  OFFLINE_BANNER_COPY,
  OFFLINE_RETURNED_COPY,
  OFFLINE_ROUTE_BLOCKED_COPY,
} from "@/lib/pwa/copy";

/**
 * Estas pruebas no comprueban redacción: comprueban una restricción de
 * producto. PawPass no tiene backend, así que ninguna línea de la UI de
 * campo puede prometer sincronización remota, envío diferido ni copia en la
 * nube. Es el tipo de promesa que se cuela en un文案, suena bien y es falsa.
 *
 * Si alguna vez existiese backend, esta prueba avisa de que hay que reescribir
 * el copy a propósito, en lugar de que la promesa outdated sobreviva.
 */

const TODAS_LAS_LINEAS: Array<[string, string]> = [
  ["OFFLINE_BANNER_COPY.titulo", OFFLINE_BANNER_COPY.titulo],
  ["OFFLINE_BANNER_COPY.cuerpo", OFFLINE_BANNER_COPY.cuerpo],
  ["OFFLINE_BANNER_COPY.accion", OFFLINE_BANNER_COPY.accion],
  ["OFFLINE_RETURNED_COPY.titulo", OFFLINE_RETURNED_COPY.titulo],
  ["OFFLINE_RETURNED_COPY.cuerpo", OFFLINE_RETURNED_COPY.cuerpo],
  ["OFFLINE_ROUTE_BLOCKED_COPY.titulo", OFFLINE_ROUTE_BLOCKED_COPY.titulo],
  ["OFFLINE_ROUTE_BLOCKED_COPY.cuerpo", OFFLINE_ROUTE_BLOCKED_COPY.cuerpo],
  ["OFFLINE_ROUTE_BLOCKED_COPY.accion", OFFLINE_ROUTE_BLOCKED_COPY.accion],
  ["INSTALL_CTA_COPY.titulo", INSTALL_CTA_COPY.titulo],
  ["INSTALL_CTA_COPY.cuerpo", INSTALL_CTA_COPY.cuerpo],
  ["INSTALL_CTA_COPY.accion", INSTALL_CTA_COPY.accion],
  ["INSTALL_CTA_COPY.descartar", INSTALL_CTA_COPY.descartar],
  ["LOST_MODE_LOCAL_COPY.aviso", LOST_MODE_LOCAL_COPY.aviso],
  ["LOST_MODE_LOCAL_COPY.detalle", LOST_MODE_LOCAL_COPY.detalle],
];

/** Promesas que el producto no puede cumplir hoy. */
const PROMESAS_QUE_NO_EXISTEN = [
  "sincroniz",
  "se enviar",
  "enviaré",
  "se guardará en la nube",
  "en la nube",
  "más tarde se",
  "cuando vuelvas a estar en línea se",
  "se actualizará solo",
  "se actualizará automáticamente",
  "automáticamente",
  "cloud",
  "sync",
  "pendientes de enviar",
  "cola de envío",
];

describe("copy de la experiencia de campo", () => {
  it("no promete sincronización con servidor, porque no hay servidor", () => {
    for (const [nombre, texto] of TODAS_LAS_LINEAS) {
      const normalizado = texto.toLowerCase();
      for (const promesa of PROMESAS_QUE_NO_EXISTEN) {
        expect(
          normalizado.includes(promesa),
          `${nombre} promete "${promesa}", que hoy no es cierto`
        ).toBe(false);
      }
    }
  });

  it("cada línea tiene contenido real: no hay cadenas vacías que oculten copy", () => {
    for (const [nombre, texto] of TODAS_LAS_LINEAS) {
      expect(texto.trim().length, `${nombre} está vacío`).toBeGreaterThan(0);
    }
  });

  it("el estado sin conexión se nombra, nunca se disimula", () => {
    expect(OFFLINE_BANNER_COPY.titulo.toLowerCase()).toContain("conexión");
    expect(OFFLINE_BANNER_COPY.titulo.toLowerCase()).toContain("sin");
  });

  it("el copy sin conexión dice qué sí se puede hacer", () => {
    // La parte que hace útil el aviso: no solo el problema, también el alcance.
    expect(OFFLINE_BANNER_COPY.cuerpo.toLowerCase()).toContain("este dispositivo");
  });

  it("el estado online se comunica como 'sin conexión', no como servidor disponible", () => {
    // `navigator.onLine` describe la red del dispositivo, no un servidor de
    // PawPass. Ninguna línea puede insinuar que hay backend respondiendo.
    for (const [, texto] of TODAS_LAS_LINEAS) {
      expect(texto.toLowerCase()).not.toContain("servidor disponible");
    }
  });

  it("el aviso de ruta bloqueada ofrece una salida concreta", () => {
    expect(OFFLINE_ROUTE_BLOCKED_COPY.accion.toLowerCase()).toContain("inicio");
    expect(OFFLINE_ROUTE_BLOCKED_COPY.cuerpo.toLowerCase()).toContain("este dispositivo");
  });

  it("el aviso de ruta bloqueada explica por qué, sin culpar a la persona", () => {
    // "vuelve a estar en línea" describe una condición, no un fallo del usuario.
    expect(OFFLINE_ROUTE_BLOCKED_COPY.cuerpo).toContain("en línea");
  });

  it("la recuperación de conexión se anuncia sin dramatismo", () => {
    expect(OFFLINE_RETURNED_COPY.titulo.toLowerCase()).toContain("conexión");
    expect(OFFLINE_RETURNED_COPY.titulo.length).toBeLessThan(40);
  });

  it("el CTA de instalar ofrece cerrar: no es una orden", () => {
    expect(INSTALL_CTA_COPY.descartar.length).toBeGreaterThan(0);
    expect(INSTALL_CTA_COPY.descartar.toLowerCase()).not.toBe(INSTALL_CTA_COPY.accion.toLowerCase());
  });

  it("el CTA de instalar nombra la aplicación, sin jerga técnica", () => {
    expect(INSTALL_CTA_COPY.titulo).toContain("PawPass");
    for (const jerga of ["pwa", "service worker", "manifest", "standalone"]) {
      expect(INSTALL_CTA_COPY.cuerpo.toLowerCase()).not.toContain(jerga);
    }
  });

  it("el aviso del modo alerta declara que es local, sin pedir perdón por ello", () => {
    expect(LOST_MODE_LOCAL_COPY.aviso.toLowerCase()).toContain("este dispositivo");
    expect(LOST_MODE_LOCAL_COPY.detalle.toLowerCase()).toContain("no tiene servidor");
  });

  it("el aviso del modo alerta da una salida real: compartir enlace o imagen", () => {
    // Decir "solo aquí" sin decir qué hacer deja a la persona sin opciones en una
    // emergencia, que es justo el momento en que peor se siente esto.
    const detalle = LOST_MODE_LOCAL_COPY.detalle.toLowerCase();
    expect(detalle).toContain("comparte");
  });
});
