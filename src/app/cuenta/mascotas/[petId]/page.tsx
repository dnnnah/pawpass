import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { Surface } from "@/components/ui/Surface";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { LogoutButton } from "../../LogoutButton";
import { PetSettingsForm } from "../../PetSettingsForm";
import { QRShareCard } from "@/components/features/pet-profile/QRShareCard";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import { PetCarnetEditor, type CarnetDocument, type CarnetHealth, type CarnetPet, type CarnetVaccine } from "./PetCarnetEditor";

export const metadata: Metadata = {
  title: "Carnet privado | PawPass",
  description: "Información privada de tu mascota.",
};

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
function record(value: unknown): Row { return typeof value === "object" && value !== null ? value as Row : {}; }
function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function list(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }

function healthFrom(row: Row): CarnetHealth {
  return {
    allergies: list(row.alergias),
    conditions: list(row.condiciones_medicas),
    medications: list(row.medicamentos_actuales),
    specialDiet: text(row.dieta_especial),
    behavior: text(row.comportamiento),
    emergencyCareNote: text(row.nota_cuidados_emergencia),
  };
}

export default async function PetCarnetPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = await params;
  if (!hasSupabaseEnv()) notFound();
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try { for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options); }
      catch { /* Server Components can read the session even when they cannot write cookies. */ }
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/cuenta/mascotas/${petId}`)}`);

  const { data: ownership, error: ownershipError } = await supabase.from("pet_ownerships")
    .select("rol").eq("pet_id", petId).eq("user_id", user.id).is("ended_at", null).maybeSingle();
  if (ownershipError || !ownership) notFound();

  const [petResult, healthResult, vaccineResult, documentResult] = await Promise.all([
    supabase.from("pets").select("id, codigo_publico, nombre, especie, fecha_nacimiento, raza, genero, talla, color, peso_kg, esterilizado, microchip, rasgos_distintivos, notas_identificacion").eq("id", petId).maybeSingle(),
    supabase.from("pet_health").select("alergias, condiciones_medicas, medicamentos_actuales, dieta_especial, comportamiento, nota_cuidados_emergencia").eq("pet_id", petId).maybeSingle(),
    supabase.from("pet_vaccines").select("id, nombre, fecha_aplicacion, proxima_dosis, lote, documento_id, visible_publico").eq("pet_id", petId).order("fecha_aplicacion", { ascending: false }),
    supabase.from("pet_documents").select("id, nombre, categoria, tipo, bucket_id, object_path, mime_type, tamano_bytes, fecha, descripcion, visible_publico, created_at").eq("pet_id", petId).order("created_at", { ascending: false }).limit(100),
  ]);

  if (!petResult.data || petResult.error) notFound();
  if (healthResult.error || vaccineResult.error || documentResult.error) {
    return <AppShell><div className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}><h1 className="font-semibold text-ink">No pudimos cargar el carnet</h1><p className="mt-1 text-sm leading-6 text-ink-2">Intenta volver a cargar esta página.</p><Button href="/cuenta" variant="secondary" className="mt-4">Volver a tus mascotas</Button></Surface></div></AppShell>;
  }

  const petRow = record(petResult.data);
  const publicCode = text(petRow.codigo_publico);
  const pet: CarnetPet = {
    id: petId,
    name: text(petRow.nombre),
    species: petRow.especie === "perro" ? "perro" : "gato",
    birthDate: text(petRow.fecha_nacimiento),
    breed: text(petRow.raza),
    gender: text(petRow.genero),
    size: text(petRow.talla),
    color: text(petRow.color),
    weightKg: petRow.peso_kg === null || petRow.peso_kg === undefined ? "" : String(petRow.peso_kg),
    sterilized: typeof petRow.esterilizado === "boolean" ? petRow.esterilizado : null,
    microchip: text(petRow.microchip),
    distinctiveTraits: list(petRow.rasgos_distintivos),
    identificationNotes: text(petRow.notas_identificacion),
  };
  const vaccines: CarnetVaccine[] = (vaccineResult.data ?? []).map((item) => {
    const row = record(item);
    return { id: text(row.id), name: text(row.nombre), applicationDate: text(row.fecha_aplicacion), nextDose: text(row.proxima_dosis), batch: text(row.lote), documentId: text(row.documento_id), visiblePublic: row.visible_publico === true };
  });
  const documents: CarnetDocument[] = await Promise.all((documentResult.data ?? []).map(async (item) => {
    const row = record(item);
    const bucketId = row.bucket_id === "pawpass-fotos" ? "pawpass-fotos" : "pawpass-documentos";
    const path = text(row.object_path);
    const { data } = await supabase.storage.from(bucketId).createSignedUrl(path, 300);
    return {
      id: text(row.id), name: text(row.nombre), category: text(row.categoria), type: row.tipo === "pdf" || row.tipo === "otro" ? row.tipo : "imagen", visiblePublic: row.visible_publico === true,
      bucketId, objectPath: path, mimeType: text(row.mime_type), size: Number(row.tamano_bytes), date: text(row.fecha),
      description: text(row.descripcion), signedUrl: data?.signedUrl ?? null,
    };
  }));

  return <AppShell>
    <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="space-y-7">
        <SubpageHeader eyebrow="Carnet privado" title={pet.name} description="Solo las cuentas con tutela activa pueden ver este expediente." action={<LogoutButton />} />
        <Button href="/cuenta" variant="secondary" size="sm">Volver a mis mascotas</Button>
        <PetSettingsForm petId={petId} petName={pet.name} publicCode={publicCode} canEdit={ownership.rol === "administrador"} />
        <QRShareCard petName={pet.name} petCode={publicCode} profileUrl={getPublicProfileUrl(publicCode) ?? ""} />
        <PetCarnetEditor
          pet={pet}
          health={healthFrom(record(healthResult.data))}
          vaccines={vaccines}
          documents={documents}
          canEdit={ownership.rol === "administrador"}
        />
      </div>
    </div>
  </AppShell>;
}
