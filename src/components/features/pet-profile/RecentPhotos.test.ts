import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RecentPhotos } from "./RecentPhotos";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const imageProps = { ...props };
    delete imageProps.unoptimized;
    return createElement("img", imageProps);
  },
}));

const PHOTO = { id: "foto-1", name: "Paseo en el parque", url: "https://fotos.test/paseo.jpg", date: "26 oct 2026" };

describe("fotos recientes del perfil", () => {
  it("muestra un estado vacío cuando no hay fotos autorizadas", () => {
    const html = renderToStaticMarkup(createElement(RecentPhotos, { photos: [], profilePhoto: null }));
    expect(html).toContain("Aún no hay fotos compartidas");
  });

  it("muestra las fotos autorizadas con carga diferida y abre cada una para verla", () => {
    const html = renderToStaticMarkup(createElement(RecentPhotos, { photos: [PHOTO], profilePhoto: null }));
    expect(html).toContain('src="https://fotos.test/paseo.jpg"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('aria-label="Ver foto: Paseo en el parque"');
    expect(html).toContain("grid-cols-3");
    expect(html).toContain("sm:grid-cols-4");
  });
});
