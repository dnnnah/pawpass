import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20261026212000_privacidad_archivos_y_rescate.sql", import.meta.url),
  "utf8",
);
const lostProfileMigration = readFileSync(
  new URL("../../../supabase/migrations/20261027160000_perfil_voluntario_durante_alerta.sql", import.meta.url),
  "utf8",
);
const rescueMigration = readFileSync(
  new URL("../../../supabase/migrations/20261025190000_publicacion_rescate_qr.sql", import.meta.url),
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

  it("conserva por código el perfil voluntario activo durante una alerta sin incluir perdidas en el listado", () => {
    const lookup = lostProfileMigration.match(/create or replace function private\.obtener_perfil_publico[\s\S]*?\$function\$;/i)?.[0];
    expect(lookup).toMatch(/join public\.pet_privacy privacy on privacy\.pet_id = p\.id and privacy\.publicado/i);
    expect(lookup).toMatch(/p\.estado in \('en_casa', 'en_adopcion', 'perdido'\)/i);
    expect(lookup).not.toMatch(/not exists\s*\(select 1 from public\.pet_lost_alerts/i);
    expect(lookup).not.toMatch(/mostrar_archivos\s*=\s*true/i);
    const profileList = migration.match(/create or replace function private\.listar_perfiles_publicos[\s\S]*?\$function\$;/i)?.[0];
    expect(profileList).toMatch(/p\.estado\s*=\s*'en_casa'/i);
  });

  it("permite firmar solo la foto principal de identidad de una ficha QR", () => {
    const policy = rescueMigration.match(/create or replace function private\.puede_leer_foto_qr[\s\S]*?\$function\$;/i)?.[0];
    expect(policy).toMatch(/p_bucket\s*=\s*'pawpass-fotos'/i);
    expect(policy).toMatch(/d\.categoria\s*=\s*'foto'/i);
    expect(policy).toMatch(/d\.tipo\s*=\s*'imagen'/i);
    expect(policy).toMatch(/d\.id\s*=\s*\(\s*select d0\.id/i);
    expect(policy).toMatch(/order by d0\.created_at asc, d0\.id asc/i);
    expect(rescueMigration).toMatch(/create policy pawpass_qr_photo_read[\s\S]*?using\s*\(private\.puede_leer_foto_qr\(bucket_id, name\)\)/i);
  });
});
