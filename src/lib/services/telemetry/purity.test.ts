import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guardas arquitectónicas de la integración de telemetría con la UI (FASE 8B).
 *
 * Estas guardas no se pueden escribir como tests de comportamiento porque no
 * hay DOM en el entorno de tests. Comprueban la forma del código, que es
 * justamente lo que un test de clic no detectaría: que la UI no se salta la
 * fachada, que no mide el render, que no introduce campos nuevos en el contrato
 * y que no monta infraestructura por su cuenta.
 *
 * Siguen la misma línea que `src/lib/domain/purity.test.ts` y
 * `src/lib/pwa/purity.test.ts`: derivan la lista de archivos del directorio en
 * lugar de mantenerla a mano, para que un módulo nuevo quede cubierto desde el
 * momento en que se escribe.
 */

const TELEMETRY_SERVICE_DIR = resolve(process.cwd(), "src/lib/services/telemetry");
const TELEMETRY_UI_DIR = resolve(process.cwd(), "src/components/telemetry");
const EVENTS_CONTRACT = resolve(process.cwd(), "src/lib/domain/telemetry/events.ts");
const TRACKERS_FACADE = resolve(process.cwd(), "src/lib/services/telemetry/trackers.ts");

/** Componentes de producto que se instrumentaron en esta fase. */
const INSTRUMENTED_COMPONENTS = [
  "src/components/features/pet-profile/QRShareCard.tsx",
  "src/components/features/pet-profile/EmergencyContact.tsx",
  "src/components/features/lost-pet/FoundPetPanel.tsx",
  "src/components/features/adoption/AdoptionRequestForm.tsx",
];

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function listFiles(dir: string, extension: string): string[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(extension) && !file.endsWith(".test.ts"))
    .sort();
}

/**
 * Módulos de la UI de telemetría, incluidos los `.ts` sin JSX.
 *
 * El hook de montaje se movió aquí en FASE 9B y es un `.ts`, así que listar solo
 * `.tsx` lo dejaría fuera de las guardas que le aplicaban cuando vivía en
 * services. Estas guardas son sobre el *contenido* del fichero, no sobre si
 * renderiza, así que no tienen motivo para ignorar la extensión.
 */
function listUiFiles(): string[] {
  return readdirSync(TELEMETRY_UI_DIR)
    .filter((file) => (file.endsWith(".tsx") || file.endsWith(".ts")) && !file.endsWith(".test.ts"))
    .sort()
    .map((file) => `src/components/telemetry/${file}`);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
}

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
 * APIs que la telemetría no debe tocar. Un evento que nace en la UI no puede
 * decidir su propio destino: eso es trabajo del adaptador, que hoy no hace nada.
 */
const FORBIDDEN_RUNTIME_TOKENS = [
  "fetch(",
  "XMLHttpRequest",
  "sendBeacon",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "console.",
  "navigator.",
  "document.",
  "window.",
  "location.href",
];

describe("la telemetría no Monta infraestructura por su cuenta", () => {
  const telemetryFiles = [
    ...listFiles(TELEMETRY_SERVICE_DIR, ".ts").map((file) => `src/lib/services/telemetry/${file}`),
    ...listUiFiles(),
  ];

  it("hay módulos de telemetría que vigilar", () => {
    expect(telemetryFiles.length).toBeGreaterThan(0);
  });

  for (const file of telemetryFiles) {
    it(`${file} no usa red, almacenamiento, consola ni APIs de navegador`, () => {
      const code = stripComments(read(file));
      const found = FORBIDDEN_RUNTIME_TOKENS.filter((token) => code.includes(token));

      expect(found, `infraestructura no permitida en ${file}: ${found.join(", ")}`).toEqual([]);
    });
  }
});

describe("la UI no se salta la fachada de telemetría", () => {
  const uiFiles = [
    ...listFiles(TELEMETRY_UI_DIR, ".tsx").map((file) => `src/components/telemetry/${file}`),
    ...INSTRUMENTED_COMPONENTS,
  ];

  for (const file of uiFiles) {
    it(`${file} no importa el adaptador ni el contrato de eventos`, () => {
      const specifiers = extractSpecifiers(read(file));

      // La UI habla con `trackers`. Si importara el `TelemetryClient` o el
      // adaptador, podría saltarse la validación y enviarse sola.
      expect(
        specifiers.filter((s) => s.includes("/infra/telemetry/")),
        `${file} no debe importar la capa de infraestructura`,
      ).toEqual([]);
    });

    it(`${file} no calcula KPIs`, () => {
      const specifiers = extractSpecifiers(read(file));

      // `calculateRegistrationToQrDurationMs` y compañía son funciones puras
      // para un agregador futuro, no para una página.
      expect(
        specifiers.filter((s) => s.includes("/lib/kpis/")),
        `${file} no debe importar la capa de KPI`,
      ).toEqual([]);
    });
  }

  it("la capa de UI habla con la fachada, y la fachada es lo único que habla con el adaptador", () => {
    // Ningún componente importa `/infra/telemetry/`. Si lo hiciera, podría
    // emitir saltándose la validación del contrato.
    for (const file of uiFiles) {
      const importsInfra = extractSpecifiers(read(file)).some((s) =>
        s.includes("/infra/telemetry/"),
      );
      expect(importsInfra, `${file} importa el adaptador directamente`).toBe(false);
    }

    // Y quien sí toca telemetría lo hace por `trackers`, nunca por el evento en
    // crudo: el contrato es un tipo, no algo que se construya a mano en la UI.
    for (const file of uiFiles) {
      const importsTelemetry = extractSpecifiers(read(file)).some((s) =>
        s.includes("/services/telemetry/"),
      );
      const importsFacade = extractSpecifiers(read(file)).some((s) =>
        s.includes("/services/telemetry/trackers"),
      );

      if (importsTelemetry) {
        expect(importsFacade, `${file} usa telemetría sin pasar por la fachada`).toBe(true);
      }

      // La UI puede importar el contrato solo como tipo (`import type`), nunca
      // para construir un evento.
      const rawEvent = /\{\s*name:\s*['"]/.test(stripComments(read(file)));
      expect(rawEvent, `${file} construye un evento a mano`).toBe(false);
    }
  });

  /**
   * El hook de montaje (FASE 9B) queda fuera de `uiFiles` a propósito: no es un
   * componente que emita eventos, sino el mecanismo que decide *cuándo* se mide,
   * así que consume la fábrica pura `mount-observer` y no la fachada `trackers`.
   * Lo que sí debe seguir respetando es la propiedad de seguridad de esta capa:
   * hablar con services, nunca con el adaptador ni con el contrato en crudo.
   */
  it("el hook de montaje no toca ni el adaptador ni el contrato de eventos", () => {
    const hook = "src/components/telemetry/use-telemetry-on-mount.ts";
    const specifiers = extractSpecifiers(read(hook));

    expect(
      specifiers.filter((s) => s.includes("/infra/telemetry/")),
      `${hook} no debe importar la capa de infraestructura`,
    ).toEqual([]);
    expect(
      specifiers.filter((s) => s.includes("/domain/telemetry/")),
      `${hook} no debe construir eventos del contrato`,
    ).toEqual([]);
    expect(
      specifiers.filter((s) => s.includes("/services/telemetry/mount-observer")),
      `${hook} debe apoyarse en la fábrica pura de services`,
    ).not.toEqual([]);
  });
});

describe("la capa de servicios de telemetría sigue siendo independiente de React", () => {
  const files = listFiles(TELEMETRY_SERVICE_DIR, ".ts");

  /**
   * Sin excepciones (FASE 9B). El binding de React del hook de montaje se movió
   * a `src/components/telemetry/`, así que la capa de servicios no debe
   * importar React en ningún fichero. Si algún día hace falta una excepción,
   * que vuelva a aparecer aquí de forma explícita y no como olvido.
   */
  const REACT_ALLOWLIST = new Set<string>();

  it("ningún módulo de servicios importa React", () => {
    const withReact = files.filter((file) =>
      extractSpecifiers(readFileSync(resolve(TELEMETRY_SERVICE_DIR, file), "utf8")).some(
        (specifier) => specifier === "react" || specifier.startsWith("react/"),
      ),
    );

    expect(withReact).toEqual([...REACT_ALLOWLIST].sort());
  });

  for (const file of files.filter((name) => !REACT_ALLOWLIST.has(name))) {
    it(`${file} no importa React, Next.js ni la capa de presentación`, () => {
      const specifiers = extractSpecifiers(readFileSync(resolve(TELEMETRY_SERVICE_DIR, file), "utf8"));
      const violations = specifiers.filter(
        (specifier) =>
          specifier === "react" ||
          specifier.startsWith("react/") ||
          specifier === "next" ||
          specifier.startsWith("next/") ||
          specifier.includes("/components/") ||
          specifier.includes("/app/"),
      );

      expect(violations, `imports de UI en ${file}: ${violations.join(", ")}`).toEqual([]);
    });
  }
});

describe("la UI no inventa valores fuera del contrato de eventos", () => {
  const contract = readFileSync(EVENTS_CONTRACT, "utf8");

  /** Extrae `{ campo: 'a' | 'b' }` de los alias `…Context` del contrato. */
  function contractValues(): Map<string, Map<string, Set<string>>> {
    const contexts = new Map<string, Map<string, Set<string>>>();
    const aliasPattern = /export type (\w+Context) = \{([\s\S]*?)\n\};/g;
    let alias: RegExpExecArray | null;

    while ((alias = aliasPattern.exec(contract)) !== null) {
      const [, typeName, body] = alias;
      const fields = new Map<string, Set<string>>();
      const fieldPattern = /(\w+):\s*((?:'[^']+'\s*\|\s*)*'[^']+')/g;
      let field: RegExpExecArray | null;

      while ((field = fieldPattern.exec(body)) !== null) {
        fields.set(
          field[1],
          new Set(field[2].split("|").map((value) => value.trim().replace(/'/g, ""))),
        );
      }

      contexts.set(typeName, fields);
    }

    return contexts;
  }

  /** De la firma de cada tracker: `trackX(param: SomeContext['field'] = 'def')`. */
  function trackerFields(): Map<string, { context: string; field: string; fallback: string }> {
    const facade = readFileSync(TRACKERS_FACADE, "utf8");
    const trackers = new Map<string, { context: string; field: string; fallback: string }>();
    const signaturePattern =
      /export function (track\w+)\(\s*(\w+):\s*(\w+Context)\['(\w+)'\](?:\s*=\s*'(\w+)')?/g;
    let signature: RegExpExecArray | null;

    while ((signature = signaturePattern.exec(facade)) !== null) {
      trackers.set(signature[1], {
        context: signature[3],
        field: signature[4],
        fallback: signature[5] ?? "",
      });
    }

    return trackers;
  }

  const contexts = contractValues();
  const trackers = trackerFields();

  it("se pudo leer el contrato y la fachada", () => {
    expect(contexts.size).toBeGreaterThan(0);
    expect(trackers.size).toBeGreaterThan(0);
  });

  const uiFiles = [
    ...listFiles(TELEMETRY_UI_DIR, ".tsx").map((file) => `src/components/telemetry/${file}`),
    ...INSTRUMENTED_COMPONENTS,
  ];

  for (const file of uiFiles) {
    it(`${file} solo pasa valores que el contrato declara`, () => {
      const code = stripComments(read(file));
      const callPattern = /track\w+\(\s*"([^"]+)"\s*\)/g;
      let call: RegExpExecArray | null;

      while ((call = callPattern.exec(code)) !== null) {
        const [expression, value] = call;
        const name = /track\w+/.exec(expression)?.[0] ?? "";
        const tracker = trackers.get(name);

        if (!tracker) throw new Error(`tracker no declarado en la fachada: ${name} (${file})`);

        const allowed = contexts.get(tracker.context)?.get(tracker.field);
        if (!allowed) throw new Error(`el contrato no declara ${tracker.context}.${tracker.field}`);

        expect(
          allowed.has(value),
          `${file} emite ${name}("${value}") y el contrato ${tracker.context}.${tracker.field} solo admite ${[...allowed].join(", ")}`,
        ).toBe(true);
      }
    });
  }

  for (const file of INSTRUMENTED_COMPONENTS) {
    it(`${file} sí emite, y lo hace con un valor literal revisable`, () => {
      // Un archivo instrumentado que no pase ningún literal se escapa de la
      // comprobación de arriba. Aquí se exige que la emisión exista.
      const code = stripComments(read(file));
      expect(code, `${file} no contiene ninguna llamada a un tracker`).toMatch(/track\w+\(\s*"[^"]+"\s*\)/);
    });
  }

  it("ProfileViewTracker delega el valor a un prop tipado por el contrato", () => {
    const source = read("src/components/telemetry/ProfileViewTracker.tsx");

    // No es un literal, sino el prop `section`, y ese prop está tipado con la
    // unión del contrato: TypeScript ya impide pasar un valor inventado.
    expect(source).toContain("trackProfileViewed(section)");
    expect(source).toContain('section: ProfileContext["section"]');
    expect(source).toContain('import type { ProfileContext } from "@/lib/domain/telemetry/events"');
  });

  it("las páginas del perfil solo piden secciones que el contrato declara", () => {
    const allowed = contexts.get("ProfileContext")?.get("section");
    expect(allowed).toBeDefined();

    const pages = [
      "src/app/perfil/[id]/page.tsx",
      "src/app/perfil/[id]/salud/page.tsx",
      "src/app/perfil/[id]/vacunas/page.tsx",
      "src/app/perfil/[id]/documentos/page.tsx",
      "src/app/perfil/[id]/carnet/page.tsx",
    ];

    for (const page of pages) {
      const matches = [...read(page).matchAll(/ProfileViewTracker section="([^"]+)"/g)];
      expect(matches.length, `${page} no declara la sección del perfil`).toBe(1);

      for (const match of matches) {
        expect(
          allowed?.has(match[1]),
          `${page} pide la sección "${match[1]}", fuera del contrato`,
        ).toBe(true);
      }
    }
  });

  it("cada tracker tiene su campo en el contrato y un valor por defecto válido", () => {
    for (const [name, tracker] of trackers) {
      const allowed = contexts.get(tracker.context)?.get(tracker.field);

      expect(allowed, `${name} apunta a ${tracker.context}.${tracker.field}, que no existe`).toBeDefined();
      if (tracker.fallback) {
        expect(
          allowed?.has(tracker.fallback),
          `${name} declara "${tracker.fallback}" por defecto y el contrato no lo admite`,
        ).toBe(true);
      }
    }
  });
});

describe("el contrato de eventos no se ha ampliado para la UI", () => {
  it("sigue teniendo exactamente los siete eventos de la FASE 8A", () => {
    const names = [...readFileSync(EVENTS_CONTRACT, "utf8").matchAll(/name:\s*'(\w+)'/g)].map(
      (match) => match[1],
    );

    expect([...new Set(names)].sort()).toEqual([
      "adoption_request_started",
      "emergency_action_started",
      "found_pet_flow_started",
      "profile_viewed",
      "qr_generated",
      "registration_completed",
      "registration_started",
    ]);
  });

  it("no ha aparecido ningún campo de identidad en el contrato", () => {
    const source = readFileSync(EVENTS_CONTRACT, "utf8");
    for (const token of [
      "petId",
      "pet_id",
      "slug",
      "url",
      "ownerId",
      "email",
      "phone",
      "telefono",
      "address",
      "latitude",
      "longitude",
      "message",
      "token",
      "sessionId",
      "userAgent",
    ]) {
      expect(source, `token de PII en events.ts: ${token}`).not.toContain(token);
    }
  });
});
