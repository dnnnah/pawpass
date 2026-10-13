import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildManifest,
  PWA_BACKGROUND_COLOR,
  PWA_ICON_SRC,
  PWA_THEME_COLOR,
} from "@/app/manifest";

describe("buildManifest", () => {
  const manifest = buildManifest();

  it("expone la identidad de la aplicación", () => {
    expect(manifest.name).toContain("PawPass");
    expect(manifest.short_name).toBe("PawPass");
    expect(manifest.description?.length).toBeGreaterThan(0);
    expect(manifest.lang).toBe("es");
  });

  it("define start_url, scope y display de instalación", () => {
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.id).toBe("/");
  });

  it("define colores de tema y fondo coherentes", () => {
    expect(manifest.theme_color).toBe(PWA_THEME_COLOR);
    expect(manifest.background_color).toBe(PWA_BACKGROUND_COLOR);
  });

  it("solo referencia iconos que existen en el repo", () => {
    const icons = manifest.icons ?? [];
    expect(icons.length).toBeGreaterThan(0);

    for (const icon of icons) {
      expect(icon.src).toBe(PWA_ICON_SRC);
      expect(icon.src.startsWith("/")).toBe(true);

      const filePath = resolve(process.cwd(), "src", "app", icon.src.replace(/^\//, ""));
      expect(existsSync(filePath), `el asset ${icon.src} debe existir`).toBe(true);
    }
  });

  it("incluye un icono estándar y uno maskable sin inventar assets", () => {
    const purposes = (manifest.icons ?? []).map((icon) => icon.purpose).sort();
    expect(purposes).toContain("any");
    expect(purposes).toContain("maskable");
  });

  it("no define icons PNG/192/512 que aún no existen", () => {
    const icons = manifest.icons ?? [];
    const hasPng = icons.some((icon) => (icon.type ?? "").includes("png"));
    expect(hasPng).toBe(false);
  });
});