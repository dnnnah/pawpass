/**
 * Script de Ingesta y Parseo ETL: JSON -> PostgreSQL (Supabase)
 *
 * Transforma los datos desnormalizados de:
 *   - src/data/mascotas.json (11 perfiles reales)
 *   - src/data/shelters.mock.json (2 refugios)
 *   - src/data/adopciones.mock.json (10 perfiles de adopción)
 *
 * Hacia las 20 tablas normalizadas de PostgreSQL en Supabase:
 *   - shelters, pet_shelters
 *   - pets, pet_contacts, pet_privacy
 *   - pet_health, pet_veterinarians
 *   - pet_lost_alerts, pet_vaccines, pet_dewormings, pet_consultations, pet_documents
 *
 * Genera:
 *   1. Un script SQL idempotente listo para ejecutar en Supabase SQL Editor (`scripts/output/seed.sql`).
 *   2. Un reporte JSON de mapeo con los UUIDs asignados determinísticamente (`scripts/output/uuid-mapping.json`).
 *
 * Ejecución:
 *   node scripts/seed-from-json.mts
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PetProfile } from "../src/types/pet.ts";
import type { Shelter } from "../src/types/shelter.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputDir = resolve(root, "scripts/output");

const PAWPASS_NAMESPACE = "e5792c3a-23d9-4d64-9467-3a139a0fa511";

/** Genera un UUID v5 determinista a partir de un namespace y un valor string */
function toUuid(name: string): string {
  const hash = createHash("sha1")
    .update(PAWPASS_NAMESPACE)
    .update(name)
    .digest("hex");

  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "5" + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join("-");
}

function escapeSql(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function escapeSqlArray(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const items = arr.map((item) => `"${item.replace(/"/g, '\\"')}"`).join(",");
  return `'{${items}}'::text[]`;
}

function normalizeTalla(raw: string | null | undefined): string {
  if (!raw) return "mediano";
  const lower = raw.trim().toLowerCase();
  if (lower === "miniatura") return "miniatura";
  if (lower === "pequeño" || lower === "pequeno") return "pequeno";
  if (lower === "mediano") return "mediano";
  if (lower === "grande") return "grande";
  return "mediano";
}

function normalizeEspecie(raw: string | null | undefined): string {
  if (!raw) return "perro";
  const lower = raw.trim().toLowerCase();
  return lower === "gato" ? "gato" : "perro";
}

function normalizeGenero(raw: string | null | undefined): string {
  if (!raw) return "macho";
  const lower = raw.trim().toLowerCase();
  return lower === "hembra" ? "hembra" : "macho";
}

function parseTamanoBytes(tamanoStr: string | null | undefined): number {
  if (!tamanoStr) return 1024 * 1024;
  const match = tamanoStr.match(/([\d.]+)\s*(MB|KB|GB|B)?/i);
  if (!match) return 1024 * 1024;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "MB").toUpperCase();
  if (unit === "KB") return Math.round(num * 1024);
  if (unit === "MB") return Math.round(num * 1024 * 1024);
  if (unit === "GB") return Math.round(num * 1024 * 1024 * 1024);
  return Math.round(num);
}

// Cargar fuentes
const petsRaw = JSON.parse(readFileSync(resolve(root, "src/data/mascotas.json"), "utf8")) as PetProfile[];
const sheltersRaw = JSON.parse(readFileSync(resolve(root, "src/data/shelters.mock.json"), "utf8")) as Shelter[];
const adoptionsRaw = JSON.parse(readFileSync(resolve(root, "src/data/adopciones.mock.json"), "utf8")) as PetProfile[];

const sqlStatements: string[] = [];
const uuidMap: Record<string, string> = {};

sqlStatements.push(`-- ====================================================================`);
sqlStatements.push(`-- PAWPASS — MIGRACIÓN / SEED DESDE FUENTES JSON (ETL)`);
sqlStatements.push(`-- Generado automáticamente con UUIDs deterministas`);
sqlStatements.push(`-- Compatible con el catálogo PostgreSQL 17 / Supabase`);
sqlStatements.push(`-- ====================================================================\n`);
sqlStatements.push(`BEGIN;\n`);

// 1. REFUGIOS
sqlStatements.push(`-- 1. REFUGIOS`);
for (const shelter of sheltersRaw) {
  const shelterUuid = toUuid(`shelter:${shelter.id}`);
  uuidMap[`shelter:${shelter.id}`] = shelterUuid;

  const redes = (shelter.redes || []).map((r: string) => r.trim()).filter(Boolean);

  sqlStatements.push(`
INSERT INTO public.shelters (
  id, nombre, slug, descripcion, ubicacion,
  nombre_responsable, telefono, whatsapp, email,
  redes, verificado, publicado, publicar_contacto
) VALUES (
  '${shelterUuid}',
  ${escapeSql(shelter.nombre)},
  ${escapeSql(shelter.id)},
  ${escapeSql(shelter.descripcion)},
  ${escapeSql(shelter.ubicacion)},
  ${escapeSql(shelter.contacto?.nombreResponsable)},
  ${escapeSql(shelter.contacto?.telefono)},
  ${escapeSql(shelter.contacto?.whatsapp)},
  ${escapeSql(shelter.contacto?.email)},
  ${escapeSqlArray(redes)},
  ${shelter.verificado ? "true" : "false"},
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  ubicacion = EXCLUDED.ubicacion,
  nombre_responsable = EXCLUDED.nombre_responsable,
  telefono = EXCLUDED.telefono,
  whatsapp = EXCLUDED.whatsapp,
  email = EXCLUDED.email,
  redes = EXCLUDED.redes,
  verificado = EXCLUDED.verificado,
  publicado = EXCLUDED.publicado,
  publicar_contacto = EXCLUDED.publicar_contacto;
`);
}

// 2. MASCOTAS (Reales + Mocks de Adopción)
const allPets = [...petsRaw, ...adoptionsRaw];
const processedPublicCodes = new Set<string>();
const assignedMicrochips = new Set<string>();

sqlStatements.push(`-- 2. MASCOTAS Y SUB-ENTIDADES`);

for (const pet of allPets) {
  const publicCode = pet.identificacion?.codigoPublico;
  if (!publicCode || processedPublicCodes.has(publicCode)) continue;
  processedPublicCodes.add(publicCode);

  const petUuid = toUuid(`pet:${publicCode}`);
  uuidMap[`pet:${pet.id}`] = petUuid;

  const m = pet.mascota;
  const c = pet.contacto || {};
  const e = pet.emergencia || {};
  const s = pet.salud || {};
  const v = pet.veterinario || {};
  const priv = pet.configuracionPublica || {};
  const sourceMicrochip = pet.identificacion?.microchip?.trim() || null;
  const microchip = sourceMicrochip && !assignedMicrochips.has(sourceMicrochip) ? sourceMicrochip : null;
  if (microchip) assignedMicrochips.add(microchip);

  const especie = normalizeEspecie(m.especie);
  const genero = normalizeGenero(m.genero);
  const talla = normalizeTalla(m.talla);
  const estado = pet.estado || "en_casa";

  // pets
  sqlStatements.push(`
-- Mascota: ${m.nombre} (${publicCode})
INSERT INTO public.pets (
  id, codigo_publico, nombre, especie, estado, fecha_nacimiento,
  slug, raza, genero, talla, color, peso_kg, esterilizado,
  rasgos_distintivos, microchip, notas_identificacion, verificado
) VALUES (
  '${petUuid}',
  ${escapeSql(publicCode)},
  ${escapeSql(m.nombre)},
  ${escapeSql(especie)},
  ${escapeSql(estado)},
  ${escapeSql(m.fechaNacimiento)},
  ${escapeSql(pet.id)},
  ${escapeSql(m.raza)},
  ${escapeSql(genero)},
  ${escapeSql(talla)},
  ${escapeSql(m.color)},
  ${typeof m.pesoKg === "number" ? m.pesoKg : "NULL"},
  ${m.esterilizado !== undefined ? (m.esterilizado ? "true" : "false") : "NULL"},
  ${escapeSqlArray(m.rasgosDistintivos)},
  ${escapeSql(microchip)},
  ${escapeSql(pet.identificacion?.notas)},
  ${pet.verificado ? "true" : "false"}
) ON CONFLICT (codigo_publico) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  especie = EXCLUDED.especie,
  estado = EXCLUDED.estado,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  slug = EXCLUDED.slug,
  raza = EXCLUDED.raza,
  genero = EXCLUDED.genero,
  talla = EXCLUDED.talla,
  color = EXCLUDED.color,
  peso_kg = EXCLUDED.peso_kg,
  esterilizado = EXCLUDED.esterilizado,
  rasgos_distintivos = EXCLUDED.rasgos_distintivos,
  microchip = EXCLUDED.microchip,
  notas_identificacion = EXCLUDED.notas_identificacion,
  verificado = EXCLUDED.verificado;
`);

  // pet_contacts
  sqlStatements.push(`
INSERT INTO public.pet_contacts (
  pet_id, nombre_publico, telefono_principal, whatsapp, telefono_secundario,
  email, zona_segura, zona_habitual, mensaje_whatsapp
) VALUES (
  '${petUuid}',
  ${escapeSql(c.nombrePublico || null)},
  ${escapeSql(c.telefonoPrincipal || null)},
  ${escapeSql(c.whatsapp || null)},
  ${escapeSql(c.telefonoSecundario || null)},
  ${escapeSql(c.email && c.email.includes("@") ? c.email : null)},
  ${escapeSql(c.zonaSegura || null)},
  ${escapeSql(c.zonaHabitual || null)},
  ${escapeSql(c.mensajeWhatsapp || null)}
) ON CONFLICT (pet_id) DO UPDATE SET
  nombre_publico = EXCLUDED.nombre_publico,
  telefono_principal = EXCLUDED.telefono_principal,
  whatsapp = EXCLUDED.whatsapp,
  telefono_secundario = EXCLUDED.telefono_secundario,
  email = EXCLUDED.email,
  zona_segura = EXCLUDED.zona_segura,
  zona_habitual = EXCLUDED.zona_habitual,
  mensaje_whatsapp = EXCLUDED.mensaje_whatsapp;
`);

  // pet_privacy
  sqlStatements.push(`
INSERT INTO public.pet_privacy (
  pet_id, publicado, listar_catalogo,
  mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario,
  mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet,
  mostrar_emergencia, mostrar_microchip
) VALUES (
  '${petUuid}',
  true,
  ${estado === "en_adopcion" ? "true" : "false"},
  true,
  true,
  true,
  ${priv.mostrarTelefonoSecundario ? "true" : "false"},
  ${priv.mostrarEmail ? "true" : "false"},
  true,
  true,
  true,
  ${priv.mostrarDireccionVet ? "true" : "false"},
  true,
  true
) ON CONFLICT (pet_id) DO UPDATE SET
  publicado = EXCLUDED.publicado,
  listar_catalogo = EXCLUDED.listar_catalogo,
  mostrar_nombre_contacto = EXCLUDED.mostrar_nombre_contacto,
  mostrar_telefono = EXCLUDED.mostrar_telefono,
  mostrar_whatsapp = EXCLUDED.mostrar_whatsapp,
  mostrar_telefono_secundario = EXCLUDED.mostrar_telefono_secundario,
  mostrar_email = EXCLUDED.mostrar_email,
  mostrar_zona = EXCLUDED.mostrar_zona,
  mostrar_salud = EXCLUDED.mostrar_salud,
  mostrar_veterinario = EXCLUDED.mostrar_veterinario,
  mostrar_direccion_vet = EXCLUDED.mostrar_direccion_vet,
  mostrar_emergencia = EXCLUDED.mostrar_emergencia,
  mostrar_microchip = EXCLUDED.mostrar_microchip;
`);

  // pet_health
  sqlStatements.push(`
INSERT INTO public.pet_health (
  pet_id, alergias, condiciones_medicas, medicamentos_actuales,
  dieta_especial, comportamiento
) VALUES (
  '${petUuid}',
  ${escapeSqlArray(s.alergias)},
  ${escapeSqlArray(s.condicionesMedicas)},
  ${escapeSqlArray(s.medicamentosActuales)},
  ${escapeSql(s.dietaEspecial || null)},
  ${escapeSql(s.comportamiento || null)}
) ON CONFLICT (pet_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  condiciones_medicas = EXCLUDED.condiciones_medicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  dieta_especial = EXCLUDED.dieta_especial,
  comportamiento = EXCLUDED.comportamiento;
`);

  // pet_veterinarians
  if (v.nombre || v.clinica) {
    sqlStatements.push(`
INSERT INTO public.pet_veterinarians (
  pet_id, clinica, nombre, telefono, direccion, horario
) VALUES (
  '${petUuid}',
  ${escapeSql(v.clinica || null)},
  ${escapeSql(v.nombre || null)},
  ${escapeSql(v.telefono || null)},
  ${escapeSql(v.direccion || null)},
  ${escapeSql(v.horario || null)}
) ON CONFLICT (pet_id) DO UPDATE SET
  clinica = EXCLUDED.clinica,
  nombre = EXCLUDED.nombre,
  telefono = EXCLUDED.telefono,
  direccion = EXCLUDED.direccion,
  horario = EXCLUDED.horario;
`);
  }

  // pet_lost_alerts (si está perdida en los datos)
  if (e.perdido || estado === "perdido") {
    const alertUuid = toUuid(`alert:${petUuid}`);
    sqlStatements.push(`
INSERT INTO public.pet_lost_alerts (
  id, pet_id, fecha_perdida, zona, mensaje, recompensa, instrucciones, ended_at
) VALUES (
  '${alertUuid}',
  '${petUuid}',
  ${escapeSql(e.fechaPerdida || new Date().toISOString().slice(0, 10))},
  ${escapeSql(e.zonaPerdida || c.zonaHabitual || "Zona no especificada")},
  ${escapeSql(e.mensajeEmergencia || null)},
  ${typeof e.recompensa === "number" ? e.recompensa : "NULL"},
  ${escapeSqlArray(e.instrucciones || [])},
  NULL
) ON CONFLICT (id) DO NOTHING;
`);
  }

  // vacunas
  if (Array.isArray(pet.vacunas)) {
    for (const vac of pet.vacunas) {
      const vacUuid = toUuid(`vac:${petUuid}:${vac.id || vac.nombre}`);
      sqlStatements.push(`
INSERT INTO public.pet_vaccines (
  id, pet_id, nombre, fecha_aplicacion, proxima_dosis, lote, veterinario, visible_publico
) VALUES (
  '${vacUuid}',
  '${petUuid}',
  ${escapeSql(vac.nombre)},
  ${escapeSql(vac.fechaAplicacion)},
  ${escapeSql(vac.proximaDosis || null)},
  ${escapeSql(vac.lote || null)},
  ${escapeSql(vac.veterinario || null)},
  true
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  fecha_aplicacion = EXCLUDED.fecha_aplicacion,
  proxima_dosis = EXCLUDED.proxima_dosis,
  lote = EXCLUDED.lote,
  veterinario = EXCLUDED.veterinario,
  visible_publico = EXCLUDED.visible_publico;
`);
    }
  }

  // desparasitaciones
  if (Array.isArray(pet.desparasitaciones)) {
    for (const desp of pet.desparasitaciones) {
      const despUuid = toUuid(`desp:${petUuid}:${desp.id || desp.producto}`);
      sqlStatements.push(`
INSERT INTO public.pet_dewormings (
  id, pet_id, producto, fecha, proxima_fecha, dosis, veterinario, visible_publico
) VALUES (
  '${despUuid}',
  '${petUuid}',
  ${escapeSql(desp.producto)},
  ${escapeSql(desp.fecha)},
  ${escapeSql(desp.proximaFecha || null)},
  ${escapeSql(desp.dosis || null)},
  ${escapeSql(desp.veterinario || null)},
  true
) ON CONFLICT (id) DO NOTHING;
`);
    }
  }

  // historial médico / consultas
  if (Array.isArray(pet.historialMedico)) {
    for (const med of pet.historialMedico) {
      const medUuid = toUuid(`med:${petUuid}:${med.id || med.motivo}`);
      sqlStatements.push(`
INSERT INTO public.pet_consultations (
  id, pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario, visible_publico
) VALUES (
  '${medUuid}',
  '${petUuid}',
  ${escapeSql(med.fecha || null)},
  ${escapeSql(med.motivo)},
  ${escapeSql(med.diagnostico || null)},
  ${escapeSql(med.tratamiento || null)},
  ${escapeSqlArray(med.medicamentos || [])},
  ${escapeSql(med.veterinario || null)},
  true
) ON CONFLICT (id) DO NOTHING;
`);
    }
  }

  // documentos
  if (Array.isArray(pet.documentos)) {
    for (const doc of pet.documentos) {
      const docUuid = toUuid(`doc:${petUuid}:${doc.id || doc.url}`);
      const isFoto = doc.categoria === "foto";
      const bucketId = isFoto ? "pawpass-fotos" : "pawpass-documentos";
      const fileName = basename(doc.url || "archivo.bin");
      const objectPath = `${docUuid}/${fileName}`;
      const mimeType = doc.tipo === "pdf" ? "application/pdf" : isFoto ? "image/jpeg" : "application/octet-stream";
      const tamanoBytes = parseTamanoBytes(doc.tamano);

      sqlStatements.push(`
INSERT INTO public.pet_documents (
  id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type,
  tamano_bytes, fecha, descripcion, visible_publico
) VALUES (
  '${docUuid}',
  '${petUuid}',
  ${escapeSql(doc.nombre)},
  ${escapeSql(doc.categoria || "otro")},
  ${escapeSql(doc.tipo || "otro")},
  '${bucketId}',
  ${escapeSql(objectPath)},
  '${mimeType}',
  ${tamanoBytes},
  ${escapeSql(doc.fecha || null)},
  ${escapeSql(doc.descripcion || null)},
  ${doc.visiblePublico ? "true" : "false"}
) ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  bucket_id = EXCLUDED.bucket_id,
  object_path = EXCLUDED.object_path,
  mime_type = EXCLUDED.mime_type,
  tamano_bytes = EXCLUDED.tamano_bytes,
  fecha = EXCLUDED.fecha,
  descripcion = EXCLUDED.descripcion,
  visible_publico = EXCLUDED.visible_publico;
`);
    }
  }
}

// 3. VÍNCULOS REFUGIO <-> MASCOTA
sqlStatements.push(`-- 3. VÍNCULOS REFUGIO <-> MASCOTA`);
for (const shelter of sheltersRaw) {
  const shelterUuid = uuidMap[`shelter:${shelter.id}`];
  if (!shelterUuid) continue;

  for (const petId of shelter.mascotas || []) {
    const petUuid = uuidMap[`pet:${petId}`];
    if (!petUuid) continue;

    const linkUuid = toUuid(`link:${shelterUuid}:${petUuid}`);
    sqlStatements.push(`
INSERT INTO public.pet_shelters (
  id, pet_id, shelter_id, started_at, ended_at
) VALUES (
  '${linkUuid}',
  '${petUuid}',
  '${shelterUuid}',
  NOW(),
  NULL
) ON CONFLICT (id) DO NOTHING;
`);
  }
}

sqlStatements.push(`COMMIT;\n`);

// Crear directorio de salida y guardar archivos
mkdirSync(outputDir, { recursive: true });

const sqlPath = resolve(outputDir, "seed-pawpass-from-json.sql");
const mapPath = resolve(outputDir, "uuid-mapping.json");

writeFileSync(sqlPath, sqlStatements.join("\n"), "utf8");
writeFileSync(mapPath, JSON.stringify(uuidMap, null, 2), "utf8");

console.log(`✅ Script de migración SQL generado con éxito:`);
console.log(`   - Archivo SQL: ${sqlPath}`);
console.log(`   - Mapeo de UUIDs: ${mapPath}`);
console.log(`   - Total mascotas procesadas: ${processedPublicCodes.size}`);
console.log(`   - Total refugios procesados: ${sheltersRaw.length}`);
