import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda arquitectónica: la capa `domain` es 100% pura y no debe depender de
 * React, Next.js, Supabase, lucide-react, framer-motion, componentes ni de la
 * capa de mapeo/presentación.
 */

const DOMAIN_DIR = resolve(process.cwd(), "src/lib/domain");

const FORBIDDEN_PREFIXES = ["react", "next", "@supabase", "lucide-react", "framer-motion"];

function isForbiddenSpecifier(specifier: string): boolean {
  return FORBIDDEN_PREFIXES.some(
    (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`) || specifier.startsWith(`${prefix}@`),
  );
}

function isBusinessImport(specifier: string): boolean {
  return (
    (specifier.startsWith("@/") && specifier.includes("/mapping/")) ||
    specifier.includes("/components/") ||
    specifier.includes("/ui/")
  );
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

function listDomainFiles(): string[] {
  return readdirSync(DOMAIN_DIR)
    .filter((file) => file.endsWith(".ts"))
    .filter((file) => !file.endsWith(".test.ts"))
    .sort();
}

describe("pureza de la capa domain", () => {
  const files = listDomainFiles();

  it("no está vacía y contiene los módulos de FASE 5", () => {
    expect(files).toContain("health.ts");
    expect(files).toContain("vaccine.ts");
    expect(files).toContain("dateRules.ts");
  });

  for (const file of files) {
    const source = readFileSync(resolve(DOMAIN_DIR, file), "utf8");
    const specifiers = extractSpecifiers(source);

    const violations = specifiers.filter(isForbiddenSpecifier);
    const businessViolations = specifiers.filter(isBusinessImport);

    it(`${file} no importa de dependencias de UI ni de la capa de presentación`, () => {
      expect(violations, `imports prohibidos en ${file}: ${violations.join(", ")}`).toEqual([]);
      expect(businessViolations).toEqual([]);
    });
  }
});

describe("pureza de los contratos FASE 5", () => {
  it("src/types/health.ts solo depende de otros contratos y no de UI", () => {
    const source = readFileSync(resolve(process.cwd(), "src/types/health.ts"), "utf8");
    const specifiers = extractSpecifiers(source);
    expect(specifiers.filter(isForbiddenSpecifier)).toEqual([]);
  });
});

describe("pureza del Core FASE 6 (carnet físico)", () => {
  const BROWSER_TOKENS = [
    "window.",
    "document.",
    "document.createElement",
    "navigator.",
    "localStorage",
    "sessionStorage",
    "fetch(",
    "URL.createObjectURL",
    "React",
    "createElement(",
  ];

  it("src/types/carnet.ts no importa de dependencias de UI ni de la capa de presentación", () => {
    const source = readFileSync(resolve(process.cwd(), "src/types/carnet.ts"), "utf8");
    const specifiers = extractSpecifiers(source);
    expect(specifiers.map(normalizeSpecifier).filter(isForbiddenSpecifier)).toEqual([]);
    expect(specifiers.map(normalizeSpecifier).filter(isBusinessImport)).toEqual([]);
  });

  it("src/lib/domain/carnet.ts no importa de dependencias de UI ni de la capa de presentación", () => {
    const source = readFileSync(resolve(DOMAIN_DIR, "carnet.ts"), "utf8");
    const specifiers = extractSpecifiers(source).map(normalizeSpecifier);
    expect(specifiers.filter(isForbiddenSpecifier)).toEqual([]);
    expect(specifiers.filter(isBusinessImport)).toEqual([]);
  });

  it("src/lib/domain/carnet.ts no contiene API de navegador ni tokens de framework", () => {
    const source = readFileSync(resolve(DOMAIN_DIR, "carnet.ts"), "utf8");
    const codeWithoutComments = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    const found = BROWSER_TOKENS.filter((token) => codeWithoutComments.includes(token));
    expect(found, `tokens de browser/framework en domain/carnet.ts: ${found.join(", ")}`).toEqual([]);
  });

  it("el dominio de FASE 6 contiene el módulo del carnet", () => {
    expect(listDomainFiles()).toContain("carnet.ts");
  });
});

describe("pureza de telemetría FASE 8", () => {
  const PURE_TELEMETRY_FILES = [
    "src/lib/domain/telemetry/events.ts",
    "src/lib/domain/telemetry/types.ts",
    "src/lib/domain/telemetry/validators.ts",
    "src/lib/kpis/calculations.ts",
  ];

  for (const file of PURE_TELEMETRY_FILES) {
    it(`${file} no importa de UI, framework ni infraestructura`, () => {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      const specifiers = extractSpecifiers(source).map(normalizeSpecifier);
      expect(specifiers.filter(isForbiddenSpecifier)).toEqual([]);
      expect(specifiers.filter(isBusinessImport)).toEqual([]);
      expect(specifiers.filter((s) => s.includes("/services/"))).toEqual([]);
      expect(specifiers.filter((s) => s.includes("/infra/"))).toEqual([]);
    });
  }
});

function normalizeSpecifier(specifier: string): string {
  return specifier.replace(/\.(test|ts|mts)$/, "");
}

describe("pureza de los puertos de directorio FASE 9", () => {
  const PURE_PORT_FILES = [
    "src/lib/domain/directory/types.ts",
    "src/lib/publicProfileUrl.ts",
  ];

  for (const file of PURE_PORT_FILES) {
    it(`${file} no importa de UI, framework, services, infra ni datos crudos`, () => {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      const specifiers = extractSpecifiers(source).map(normalizeSpecifier);
      expect(specifiers.filter(isForbiddenSpecifier)).toEqual([]);
      expect(specifiers.filter(isBusinessImport)).toEqual([]);
      expect(specifiers.filter((s) => s.includes("/services/"))).toEqual([]);
      expect(specifiers.filter((s) => s.includes("/infra/"))).toEqual([]);
      expect(specifiers.filter((s) => s.includes("@/data/"))).toEqual([]);
    });
  }

  it("el dominio de FASE 9 contiene los puertos de directorio", () => {
    const source = readFileSync(resolve(DOMAIN_DIR, "directory/types.ts"), "utf8");
    expect(source).toContain("PetDirectory");
    expect(source).toContain("ShelterDirectory");
  });
});
