import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20261026212000_privacidad_archivos_y_rescate.sql", import.meta.url),
  "utf8",
);

describe("contrato SQL de privacidad y rescate", () => {
  it("requiere consentimiento por archivo y por sección para Storage público", () => {
    expect(migration).toMatch(/add column if not exists mostrar_archivos boolean not null default false/i);
    expect(migration).toMatch(/d\.visible_publico/i);
    expect(migration).toMatch(/privacy\.mostrar_archivos/i);
  });

  it("conserva en rescate las alertas aunque el perfil voluntario esté apagado", () => {
    const lostDirectory = migration.match(/create or replace function public\.listar_mascotas_perdidas[\s\S]*?\$function\$;/i)?.[0];
    expect(lostDirectory).toMatch(/p\.estado\s*=\s*'perdido'/i);
    expect(lostDirectory).not.toMatch(/\.publicado/i);
    const qrCard = migration.match(/create or replace function private\.obtener_ficha_publica[\s\S]*?\$function\$;/i)?.[0];
    expect(qrCard).not.toMatch(/c\.publicado/i);
  });

  it("mantiene independientes el QR de rescate y la publicación voluntaria de archivos", () => {
    const qrCard = migration.match(/create or replace function private\.obtener_ficha_publica[\s\S]*?\$function\$;/i)?.[0];
    expect(qrCard).toMatch(/'photoPath',\s*photo\.object_path/i);
    expect(qrCard).not.toMatch(/mostrar_archivos/i);
    expect(migration).toMatch(/profile\s*->>\s*'filesPublished'/i);
  });
});
