import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import { AccountLostAlertImageForm } from "@/app/cuenta/AccountLostAlertImageForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compartir alerta de pérdida | PawPass", robots: { index: false, follow: false } };

type Row = Record<string, unknown>;
function record(value: unknown): Row { return typeof value === "object" && value !== null ? value as Row : {}; }
function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function list(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }

function AlertUnavailable({ petId }: { petId: string }) {
  return <AppShell><div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6"><Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}>
    <h1 className="font-display text-2xl text-ink">No pudimos cargar la alerta</h1>
    <p className="mt-2 text-sm leading-6 text-ink-2">La alerta sigue registrada. Vuelve a intentarlo o revisa el carnet de tu mascota.</p>
    <Button href={`/cuenta/mascotas/${encodeURIComponent(petId)}`} variant="secondary" className="mt-4">Volver al carnet</Button>
  </Surface></div></AppShell>;
}

export default async function AccountLostAlertPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = await params;
  if (!hasSupabaseEnv()) notFound();
  const store = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => store.getAll(),
    setAll: (items) => { try { items.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Components can read the session without writing cookies. */ } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/cuenta/mascotas/${petId}/alerta`)}`);

  const { data: ownership, error: ownershipError } = await supabase.from("pet_ownerships")
    .select("pet_id").eq("pet_id", petId).eq("user_id", user.id).is("ended_at", null).maybeSingle();
  if (ownershipError) return <AlertUnavailable petId={petId} />;
  if (!ownership) notFound();

  const [petResult, contactResult, alertResult, photoResult] = await Promise.all([
    supabase.from("pets").select("codigo_publico, nombre, especie, raza, color, rasgos_distintivos, estado").eq("id", petId).maybeSingle(),
    supabase.from("pet_contacts").select("telefono_principal, whatsapp, email, medio_contacto_qr").eq("pet_id", petId).maybeSingle(),
    supabase.from("pet_lost_alerts").select("fecha_perdida, zona, mensaje, recompensa").eq("pet_id", petId).is("ended_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("pet_documents").select("object_path").eq("pet_id", petId).eq("bucket_id", "pawpass-fotos").eq("categoria", "foto").eq("tipo", "imagen").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  if (petResult.error || contactResult.error || alertResult.error || photoResult.error) return <AlertUnavailable petId={petId} />;
  if (!petResult.data) notFound();

  const pet = record(petResult.data);
  const contact = record(contactResult.data);
  const alert = record(alertResult.data);
  if (pet.estado !== "perdido" || !alertResult.data) notFound();

  const contactMethod = contact.medio_contacto_qr;
  const contactValue = contactMethod === "whatsapp" ? text(contact.whatsapp)
    : contactMethod === "email" ? text(contact.email)
      : text(contact.telefono_principal);
  const contactLabel = contactMethod === "email" ? "Correo de contacto" : contactMethod === "whatsapp" ? "WhatsApp de contacto" : "Teléfono de contacto";
  const contactHint = contactMethod === "email" ? "Escribe a la familia" : contactMethod === "whatsapp" ? "Envía WhatsApp" : "Llama o envía WhatsApp";
  const code = text(pet.codigo_publico);
  const profileUrl = getPublicProfileUrl(code) ?? "";
  let photoUrl: string | null = null;
  const photoPath = text(record(photoResult.data).object_path);
  if (photoPath) {
    const { data } = await supabase.storage.from("pawpass-fotos").createSignedUrl(photoPath, 600);
    photoUrl = data?.signedUrl ?? null;
  }

  return <AppShell>
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
      <Button href={`/cuenta/mascotas/${encodeURIComponent(petId)}`} variant="secondary" size="sm">Volver al carnet</Button>
      <SubpageHeader title={`Alerta de ${text(pet.nombre)}`} description="Prepara una imagen para descargar o compartir. Los datos se cargan desde la alerta activa de esta mascota." />
      <AccountLostAlertImageForm
        petName={text(pet.nombre)} species={pet.especie === "perro" ? "Perro" : "Gato"} breed={text(pet.raza)} color={text(pet.color)}
        distinctiveTraits={list(pet.rasgos_distintivos)} photoUrl={photoUrl} contactValue={contactValue} contactLabel={contactLabel}
        contactHint={contactHint} profileUrl={profileUrl} zone={text(alert.zona)} date={text(alert.fecha_perdida)}
        reward={alert.recompensa === null || alert.recompensa === undefined ? "" : String(alert.recompensa)} message={text(alert.mensaje)}
      />
    </div>
  </AppShell>;
}
