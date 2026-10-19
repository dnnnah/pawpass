import type { MetadataRoute } from "next";

/* Los colores del manifest son los mismos tokens del sistema visual, no valores
   sueltos: `--brand` (pino) y `--canvas` (papel cálido) de `globals.css`. Antes
   eran un esmeralda brillante que ya no existe en la paleta y, en un móvil
   instalado, el marco del sistema y la pantalla de inicio salían de un color
   que el producto no usa en ninguna parte. */
export const PWA_THEME_COLOR = "#1f4a3a";
export const PWA_BACKGROUND_COLOR = "#f4f1ea";
export const PWA_ICON_SRC = "/icon.svg";

/**
 * Construye el Web App Manifest de forma pura y testeable.
 *
 * Solo referencia assets que existen (`/icon.svg`, servido por Next desde
 * `src/app/icon.svg`). Los íconos PWA dedicados (PNG 192/512, apple-touch)
 * los aportará el bloque de diseño B posteriormente; ninguna URL se inventa.
 */
export function buildManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PawPass | Carnet Digital",
    short_name: "PawPass",
    description:
      "Pasaporte digital público para mascotas con QR de emergencia.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["pet", "emergency", "utilities"],
    icons: [
      {
        src: PWA_ICON_SRC,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: PWA_ICON_SRC,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

export default function manifest(): MetadataRoute.Manifest {
  return buildManifest();
}