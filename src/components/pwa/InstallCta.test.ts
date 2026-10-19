import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InstallCtaView, type InstallCtaMode } from "./InstallCta";
import { INSTALL_CTA_COPY, INSTALL_MANUAL_COPY } from "@/lib/pwa/copy";

/**
 * Se prueba la vista, no el componente con hooks. Durante SSR no se conoce la
 * capacidad del navegador, así que `InstallCta` renderizaría siempre `null` en
 * un render de servidor y su marcado no sería comprobable. La separación
 * estado/presentación es lo que permite verificar aquí que no aparece un botón
 * que no instala, que siempre hay salida, y que el copy no promete nada falso.
 */

const noop = () => undefined;

function render(mode: InstallCtaMode, busy = false): string {
  return renderToStaticMarkup(
    createElement(InstallCtaView, { mode, busy, onInstall: noop, onDismiss: noop })
  );
}

/**
 * Solo el texto visible. Buscar en el HTML crudo daría falsos positivos: el
 * atributo `data-pwa-install` contiene "pwa" y la clase `disabled:opacity-60`
 * contiene "disabled", y ninguno de los dos se leería nunca en pantalla.
 */
function visibleText(html: string): string {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buttonTags(html: string): string[] {
  return html.match(/<button[^>]*>/g) ?? [];
}

describe("InstallCtaView", () => {
  it("no dibuja nada cuando no corresponde", () => {
    // Sin diálogo nativo, fuera de iOS, o ya instalada: no hay nada que ofrecer.
    // Cualquier marca aquí sería un botón que no hace nada por dentro.
    expect(render(null)).toBe("");
  });

  it("con diálogo nativo ofrece un botón que sí instala", () => {
    const html = render("native");
    expect(html).toContain('data-pwa-install="native"');
    expect(html).toContain(INSTALL_CTA_COPY.accion);
    expect(html).toContain("<button");
  });

  it("en iOS da instrucciones, no un botón que no puede funcionar", () => {
    const html = render("manual");
    expect(html).toContain('data-pwa-install="manual"');
    expect(html).toContain(INSTALL_MANUAL_COPY.cuerpo);
    // El gesto es de iOS, no un botón: un `prompt()` aquí no abriría nada.
    expect(html).not.toContain(INSTALL_CTA_COPY.accion);
  });

  it("nunca ofrece un boton de instalar que no puede funcionar", () => {
    // En iOS no hay `beforeinstallprompt`. Un boton ahi abriria un dialogo que
    // el navegador rechaza, o no haria nada: peor que una instruccion clara.
    const html = render("manual");
    expect(visibleText(html)).not.toContain(INSTALL_CTA_COPY.accion);
    expect(buttonTags(html).length).toBe(1);
  });

  it("siempre ofrece una salida, en las dos variantes", () => {
    // Un aviso sin salida se convierte en un modal que hay que aguantar sin
    // poder seguir trabajando.
    for (const mode of ["native", "manual"] as const) {
      expect(visibleText(render(mode)), mode).toContain(INSTALL_CTA_COPY.descartar);
    }
  });

  it("deshabilita el boton mientras el navegador decide", () => {
    // El dialogo del sistema puede tardar; sin deshabilitar, un segundo toque
    // dispara dos dialogos o un error en navegadores que los rechazan.
    // Se busca el atributo `disabled`, no la clase `disabled:opacity-60`, que
    // React escribe siempre y no significa que el botón esté deshabilitado.
    const installButton = (html: string) => buttonTags(html)[0] ?? "";

    expect(installButton(render("native", true))).toContain('disabled=""');
    expect(installButton(render("native", false))).not.toContain('disabled=""');
  });

  it("nombra la app y evita la jerga técnica", () => {
    // "PWA", "service worker" o "manifest" no significan nada para quien esta en
    // una adopcion y necesita una respuesta rapida.
    const text = visibleText(render("native") + render("manual"));
    expect(text).toContain("PawPass");
    for (const jerga of ["pwa", "service worker", "manifest"]) {
      expect(text.toLowerCase(), jerga).not.toContain(jerga);
    }
  });

  it("no promete sincronización ni copias en la nube", () => {
    const text = visibleText(render("native") + render("manual")).toLowerCase();
    expect(text).not.toContain("sincroniz");
    expect(text).not.toContain("nube");
  });

  it("tiene región accesible nombrada", () => {
    expect(render("native")).toContain(`aria-label="${INSTALL_CTA_COPY.etiquetaGrupo}"`);
    expect(render("manual")).toContain(`aria-label="${INSTALL_MANUAL_COPY.etiquetaGrupo}"`);
  });

  it("usa tokens de color, no colores sueltos", () => {
    expect(render("native") + render("manual")).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  it("el icono es decorativo: el texto ya dice qué es", () => {
    // Un icono `aria-hidden` junto a un texto equivalente evita que un lector
    // de pantalla anuncie "descargar imagen" antes del contenido.
    expect(render("native")).toContain('aria-hidden="true"');
  });

  it("los botones son de tipo `button`, para no enviar formularios ajenos", () => {
    // El CTA vive en el `AppShell`; un `type` implícito en un formulario
    // contenedor haría que el clic disparara un submit inesperado.
    const html = render("native");
    const buttons = html.match(/<button[^>]*>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const tag of buttons) {
      expect(tag).toContain('type="button"');
    }
  });
});
