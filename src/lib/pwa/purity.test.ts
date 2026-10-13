import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda arquitectónica (FASE 7): la capa de infraestructura PWA permanece
 * independiente de React/Next.js y de la capa de presentación.
 *
 * Las excepciones son los hooks de cliente, que sí importan React para
 * suscribirse a eventos del navegador. Ninguna de las dos listas es fija: ambas
 * se derivan del directorio, de modo que un módulo nuevo queda cubierto por el
 * filtro desde el momento en que se escribe, sin que nadie tenga que acordarse
 * de añadirlo a una lista.
 */

const PWA_DIR = resolve(process.cwd(), "src/lib/pwa");

const REACT_ALLOWLIST = new Set([
  "useOnlineStatus.ts",
  "useInstallPrompt.ts",
  "useOfflineNavigationGuard.ts",
]);

const FORBIDDEN_PREFIXES = [
  "react",
  "next",
  "@",
  "lucide-react",
  "framer-motion",
];

/** Todo módulo de la capa, en cualquier `.ts`, incluidos los hooks. */
const LAYER_FILES = readdirSync(PWA_DIR)
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
  .sort();

/** Infraestructura pura: todo lo que no es un hook de cliente. */
const INFRA_FILES = LAYER_FILES.filter((file) => !REACT_ALLOWLIST.has(file));

function extractSpecifiers(source: string): string[] {
  const specifiers: string[] = [];

  const fromPattern = /\bfrom\s*["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = fromPattern.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  const sideEffectPattern = /^\s*import\s*["']([^"']+)["']/gm;
  while ((match = sideEffectPattern.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

/**
 * La capa se puede apoyar en sí misma (`@/lib/pwa/...`) — `installDismiss`
 * reutiliza la clave de `install`, y `offlineNavigation` comparte tipos con sus
 * consumidores — pero nunca sale hacia React, Next.js, la UI o la capa de
 * dominio. `layout.tsx` consume los hooks, no al revés.
 */
const INTRA_LAYER_PREFIX = "@/lib/pwa/";

function isViolation(specifier: string): boolean {
  if (specifier.startsWith(INTRA_LAYER_PREFIX)) {
    return false;
  }

  return FORBIDDEN_PREFIXES.some(
    (prefix) =>
      specifier === prefix ||
      specifier.startsWith(`${prefix}/`) ||
      specifier.includes("/components/") ||
      specifier.includes("/ui/") ||
      specifier.includes("/lib/domain/") ||
      specifier.includes("/data/"),
  );
}

describe("pureza de la capa de infraestructura PWA", () => {
  for (const file of INFRA_FILES) {
    const source = readFileSync(resolve(PWA_DIR, file), "utf8");
    const specifiers = extractSpecifiers(source);

    it(`${file} no importa de React, Next.js, componentes, UI ni dominio`, () => {
      const violations = specifiers.filter(isViolation);
      expect(violations, `imports prohibidos en ${file}: ${violations.join(", ")}`).toEqual([]);
    });
  }

  it("solo los hooks cliente dependen de React en la capa", () => {
    const withReact = LAYER_FILES.filter((file) => {
      const source = readFileSync(resolve(PWA_DIR, file), "utf8");
      return extractSpecifiers(source).some(
        (specifier) => specifier === "react" || specifier.startsWith("react/")
      );
    });

    expect(withReact).toEqual([...REACT_ALLOWLIST].sort());
  });
});

/**
 * Los nombres de las cachés están escritos a mano en dos sitios distintos: el
 * service worker y `cacheApi.ts`. No se pueden compartir (el SW es JavaScript
 * plano servido como estático, y esta capa no debe importar de `public/`), así
 * que el contrato se fija leyéndolos a los dos lados.
 *
 * No es una comprobación redundante: si solo se sube la versión del SW, la UI
 * consultará una caché que ya no existe y responderá siempre que no hay copia
 * local. El síntoma en campo sería "esta sección no está disponible sin
 * conexión" en secciones que sí lo están.
 */
describe("contrato de nombres de caché entre el worker y la capa", () => {
  const swSource = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
  const cacheApiSource = readFileSync(resolve(PWA_DIR, "cacheApi.ts"), "utf8");

  /**
   * Quita los comentarios antes de buscar código. `public/sw.js` documenta
   * extensamente por qué existe la separación de cachés, y esas explanations
   * mencionan `caches.match()` a propósito: sin esto, el test que vigila el
   * código passaría por estar leyendo la explicación del fallo.
   */
  function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
  }

  const swVersion = swSource.match(/const VERSION = "([^"]+)"/)?.[1];

  it("el service worker declara una versión", () => {
    expect(swVersion, "no se encontró `const VERSION` en public/sw.js").toBeDefined();
  });

  it("la caché de documentos coincide con la del worker", () => {
    const cacheApiName = cacheApiSource.match(/const CACHE_NAME = "([^"]+)"/)?.[1];
    const swName = swSource.match(/const CACHE_NAME = `pawpass-\$\{VERSION\}`/)?.[0];

    expect(swName).toBeDefined();
    expect(cacheApiName, "no se encontró CACHE_NAME en cacheApi.ts").toBe(`pawpass-${swVersion}`);
  });

  it("la caché de rutas RSC coincide con la del worker", () => {
    const cacheApiName = cacheApiSource.match(/const ROUTE_CACHE_NAME = "([^"]+)"/)?.[1];
    expect(cacheApiName, "no se encontró ROUTE_CACHE_NAME en cacheApi.ts").toBe(
      `pawpass-routes-${swVersion}`
    );
  });

  it("las dos cachés son distintas: si coincidieran, un payload pisaría su documento", () => {
    const cacheApiName = cacheApiSource.match(/const CACHE_NAME = "([^"]+)"/)?.[1];
    const routeName = cacheApiSource.match(/const ROUTE_CACHE_NAME = "([^"]+)"/)?.[1];
    expect(cacheApiName).not.toBe(routeName);
  });

  it("el worker nunca usa un match global de caché", () => {
    // `caches.match()` busca en todas las cachés, incluida la de payloads RSC,
    // que está indexada por `pathname` y contiene `/`. Servir un payload como si
    // fuera un documento dejaba la página en blanco con datos de vuelo dentro
    // del `<body>`. Cada handler debe abrir y consultar su propia caché.
    const code = stripComments(swSource);
    expect(code, "el worker usa caches.match(), que cruza cachés").not.toContain("caches.match(");
  });
});