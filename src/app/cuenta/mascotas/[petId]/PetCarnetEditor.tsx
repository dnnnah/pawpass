"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileText, ImagePlus, PawPrint, Save, Trash2, Upload } from "lucide-react";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import {
  normalizePetList,
  validatePetFile,
  validatePetHealth,
  validatePetIdentity,
  validatePetVaccine,
  type PetHealthInput,
  type PetIdentityInput,
  type PetVaccineInput,
} from "@/lib/account/petCarnet";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { setPublicRecordVisibility, updatePetPrivacyFlag, type PetSettingsClient, type PetPrivacySectionFlag, type PublicRecordVisibilityClient } from "@/lib/account/petSettings";

export type CarnetPet = {
  id: string; name: string; species: "perro" | "gato"; birthDate: string; breed: string; gender: string;
  size: string; color: string; weightKg: string; sterilized: boolean | null; microchip: string;
  distinctiveTraits: string[]; identificationNotes: string;
};
export type CarnetHealth = {
  allergies: string[]; conditions: string[]; medications: string[]; specialDiet: string; behavior: string; emergencyCareNote: string;
};
export type CarnetVaccine = { id: string; name: string; applicationDate: string; nextDose: string; batch: string; documentId: string; visiblePublic: boolean };
export type CarnetDocument = {
  id: string; name: string; category: string; type: "pdf" | "imagen" | "otro"; bucketId: "pawpass-fotos" | "pawpass-documentos";
  objectPath: string; mimeType: string; size: number; date: string; description: string; signedUrl: string | null; visiblePublic: boolean;
};
type PetCarnetEditorProps = { pet: CarnetPet; health: CarnetHealth; vaccines: CarnetVaccine[]; documents: CarnetDocument[]; canEdit: boolean; privacy: { showHealth: boolean; showFiles: boolean }; filePrivacySupported?: boolean };

const today = () => new Date().toISOString().slice(0, 10);
function initialIdentity(pet: CarnetPet): PetIdentityInput {
  return {
    name: pet.name, species: pet.species, birthDate: pet.birthDate, breed: pet.breed, gender: pet.gender, size: pet.size,
    color: pet.color, weightKg: pet.weightKg, sterilized: pet.sterilized === null ? "" : String(pet.sterilized),
    microchip: pet.microchip, distinctiveTraits: pet.distinctiveTraits.join("\n"), identificationNotes: pet.identificationNotes,
  };
}
function initialHealth(health: CarnetHealth): PetHealthInput {
  return {
    allergies: health.allergies.join("\n"), conditions: health.conditions.join("\n"), medications: health.medications.join("\n"),
    specialDiet: health.specialDiet, behavior: health.behavior, emergencyCareNote: health.emergencyCareNote,
  };
}
const emptyVaccine: PetVaccineInput = { name: "", applicationDate: "", nextDose: "", batch: "", documentId: "" };
function nullable(value: string): string | null { return value.trim() || null; }
function categoryLabel(category: string): string {
  return ({ foto: "Foto", identificacion: "Identificación", salud: "Salud", vacunas: "Vacunas", otro: "Otro" } as Record<string, string>)[category] ?? "Documento";
}
function formatDate(value: string): string {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function PetCarnetEditor({ pet, health, vaccines, documents, canEdit, privacy: initialPrivacy, filePrivacySupported = true }: PetCarnetEditorProps) {
  const router = useRouter();
  const [identity, setIdentity] = useState(() => initialIdentity(pet));
  const [healthInput, setHealthInput] = useState(() => initialHealth(health));
  const [vaccineInput, setVaccineInput] = useState<PetVaccineInput>(emptyVaccine);
  const [editingVaccineId, setEditingVaccineId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileKind, setFileKind] = useState<"foto" | "documento">("documento");
  const [fileCategory, setFileCategory] = useState("identificacion");
  const [fileName, setFileName] = useState("");
  const [fileDate, setFileDate] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [pendingUpload, setPendingUpload] = useState<{ id: string; path: string; bucketId: string; file: File } | null>(null);
  const [identityErrors, setIdentityErrors] = useState<Partial<Record<keyof PetIdentityInput, string>>>({});
  const [healthErrors, setHealthErrors] = useState<Partial<Record<keyof PetHealthInput, string>>>({});
  const [vaccineErrors, setVaccineErrors] = useState<Partial<Record<keyof PetVaccineInput, string>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(initialPrivacy);

  function ready(): boolean {
    if (hasSupabaseEnv()) return true;
    setError("El carnet necesita una conexión activa con Supabase.");
    return false;
  }
  function clearMessages() { setError(null); setNotice(null); }

  async function saveIdentity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearMessages();
    const errors = validatePetIdentity(identity, today()); setIdentityErrors(errors);
    if (Object.keys(errors).length || !canEdit || !ready()) return;
    setBusy("identity");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: saveError } = await supabase.from("pets").update({
        nombre: identity.name.trim(), especie: identity.species, fecha_nacimiento: identity.birthDate,
        raza: nullable(identity.breed), genero: nullable(identity.gender), talla: nullable(identity.size), color: nullable(identity.color),
        peso_kg: nullable(identity.weightKg), esterilizado: identity.sterilized === "" ? null : identity.sterilized === "true",
        microchip: nullable(identity.microchip), rasgos_distintivos: normalizePetList(identity.distinctiveTraits),
        notas_identificacion: nullable(identity.identificationNotes),
      }).eq("id", pet.id).select("id").maybeSingle();
      if (saveError || !data) throw new Error("No pudimos guardar los datos de identificación.");
      setNotice("Datos de identificación guardados."); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos guardar los datos de identificación."); }
    finally { setBusy(null); }
  }

  async function saveHealth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearMessages();
    const errors = validatePetHealth(healthInput); setHealthErrors(errors);
    if (Object.keys(errors).length || !canEdit || !ready()) return;
    setBusy("health");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: saveError } = await supabase.from("pet_health").upsert({
        pet_id: pet.id, alergias: normalizePetList(healthInput.allergies),
        condiciones_medicas: normalizePetList(healthInput.conditions), medicamentos_actuales: normalizePetList(healthInput.medications),
        dieta_especial: nullable(healthInput.specialDiet), comportamiento: nullable(healthInput.behavior),
        nota_cuidados_emergencia: nullable(healthInput.emergencyCareNote),
      }, { onConflict: "pet_id" });
      if (saveError) throw new Error("No pudimos guardar la información de salud.");
      setNotice("Salud y cuidados guardados."); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos guardar la información de salud."); }
    finally { setBusy(null); }
  }

  function editVaccine(vaccine: CarnetVaccine) {
    setEditingVaccineId(vaccine.id);
    setVaccineInput({ name: vaccine.name, applicationDate: vaccine.applicationDate, nextDose: vaccine.nextDose, batch: vaccine.batch, documentId: vaccine.documentId });
    setVaccineErrors({}); clearMessages();
  }
  function resetVaccine() { setEditingVaccineId(null); setVaccineInput(emptyVaccine); setVaccineErrors({}); }

  async function saveVaccine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearMessages();
    const errors = validatePetVaccine(vaccineInput, today()); setVaccineErrors(errors);
    if (Object.keys(errors).length || !canEdit || !ready()) return;
    setBusy("vaccine");
    try {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        nombre: vaccineInput.name.trim(), fecha_aplicacion: vaccineInput.applicationDate,
        proxima_dosis: nullable(vaccineInput.nextDose), lote: nullable(vaccineInput.batch), documento_id: nullable(vaccineInput.documentId),
      };
      const response = editingVaccineId
        ? await supabase.from("pet_vaccines").update(payload).eq("id", editingVaccineId).eq("pet_id", pet.id).select("id").maybeSingle()
        : await supabase.from("pet_vaccines").insert({ ...payload, pet_id: pet.id, visible_publico: false }).select("id").maybeSingle();
      if (response.error || !response.data) throw new Error("No pudimos guardar la vacuna.");
      setNotice(editingVaccineId ? "Vacuna actualizada." : "Vacuna registrada."); resetVaccine(); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos guardar la vacuna."); }
    finally { setBusy(null); }
  }

  async function deleteVaccine(vaccineId: string) {
    if (!canEdit || !ready()) return;
    clearMessages(); setBusy(`vaccine:${vaccineId}`);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: deleteError } = await supabase.from("pet_vaccines").delete().eq("id", vaccineId).eq("pet_id", pet.id).select("id").maybeSingle();
      if (deleteError || !data) throw new Error("No pudimos eliminar la vacuna.");
      if (editingVaccineId === vaccineId) resetVaccine();
      setNotice("Vacuna eliminada."); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos eliminar la vacuna."); }
    finally { setBusy(null); }
  }

  async function toggleRecordVisibility(table: "pet_documents" | "pet_vaccines", recordId: string, visible: boolean) {
    if (!canEdit || !ready()) return;
    clearMessages(); setBusy(`visibility:${recordId}`);
    const result = await setPublicRecordVisibility(
      createSupabaseBrowserClient() as unknown as PublicRecordVisibilityClient,
      table,
      pet.id,
      recordId,
      visible,
    );
    if (result) setError(result);
    else { setNotice(visible ? "El registro se compartirá en el perfil público." : "El registro seguirá privado."); router.refresh(); }
    setBusy(null);
  }

  async function toggleSectionVisibility(flag: PetPrivacySectionFlag, enabled: boolean) {
    if (!canEdit || !ready()) return;
    clearMessages(); setBusy(`privacy:${flag}`);
    const result = await updatePetPrivacyFlag(
      createSupabaseBrowserClient() as unknown as PetSettingsClient,
      pet.id,
      flag,
      enabled,
    );
    if (result) setError(result);
    else {
      setPrivacy((current) => ({ ...current, [flag]: enabled }));
      setNotice(enabled ? "Sección pública activada." : "Sección oculta del perfil público.");
      router.refresh();
    }
    setBusy(null);
  }

  async function uploadBytes(upload: NonNullable<typeof pendingUpload>) {
    setBusy("file"); clearMessages();
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage.from(upload.bucketId).upload(upload.path, upload.file, { contentType: upload.file.type, upsert: true });
      if (uploadError) { setPendingUpload(upload); throw new Error("El registro quedó creado, pero falló la carga del archivo. Puedes reintentar sin duplicarlo."); }
      setPendingUpload(null); setFile(null); setFileName(""); setFileDate(""); setFileDescription("");
      setNotice(fileKind === "foto" ? "Foto privada guardada." : "Documento privado guardado."); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos cargar el archivo."); }
    finally { setBusy(null); }
  }

  async function saveFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearMessages();
    if (!canEdit || !ready()) return;
    if (pendingUpload) { await uploadBytes(pendingUpload); return; }
    if (!file) { setError("Selecciona un archivo para continuar."); return; }
    const fileError = validatePetFile(file, fileKind); const name = fileName.trim();
    if (fileError) { setError(fileError); return; }
    if (!name || name.length > 200) { setError("El nombre debe tener entre 1 y 200 caracteres."); return; }
    if (fileDate && !/^\d{4}-\d{2}-\d{2}$/.test(fileDate)) { setError("Escribe una fecha válida para el archivo."); return; }
    if (fileDescription.trim().length > 2000) { setError("La descripción no puede superar 2,000 caracteres."); return; }

    setBusy("file");
    try {
      const supabase = createSupabaseBrowserClient();
      const bucketId = fileKind === "foto" ? "pawpass-fotos" : "pawpass-documentos";
      const category = fileKind === "foto" ? "foto" : fileCategory;
      const type = file.type === "application/pdf" ? "pdf" : "imagen";
      const { data, error: insertError } = await supabase.from("pet_documents").insert({
        pet_id: pet.id, nombre: name, categoria: category, tipo: type, bucket_id: bucketId, mime_type: file.type,
        tamano_bytes: file.size, fecha: nullable(fileDate), descripcion: nullable(fileDescription), visible_publico: false,
      }).select("id, object_path").single();
      if (insertError || !data) throw new Error("No pudimos preparar el archivo para guardarlo.");
      await uploadBytes({ id: data.id, path: data.object_path, bucketId, file });
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos guardar el archivo."); setBusy(null); }
  }

  async function deleteDocument(document: CarnetDocument) {
    if (!canEdit || !ready()) return;
    clearMessages(); setBusy(`document:${document.id}`);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: storageError } = await supabase.storage.from(document.bucketId).remove([document.objectPath]);
      if (storageError) throw new Error("No pudimos retirar el archivo privado.");
      const { data, error: rowError } = await supabase.from("pet_documents").delete().eq("id", document.id).eq("pet_id", pet.id).select("id").maybeSingle();
      if (rowError || !data) throw new Error("El archivo se retiró, pero no pudimos actualizar su registro. Intenta de nuevo.");
      setNotice("Archivo eliminado."); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos eliminar el archivo."); }
    finally { setBusy(null); }
  }

  const editable = canEdit && !busy;

  return <div className="grid gap-6">
    {!canEdit ? <Surface variant="sunken" size="sm" rest={{ role: "note" }}>Este carnet es de solo lectura para tu cuenta. La persona administradora puede editarlo.</Surface> : null}

    <Surface id="info" as="section" size="lg" className="scroll-mt-24" rest={{ "aria-labelledby": "identificacion-titulo" }}>
      <h2 id="identificacion-titulo" className="font-display text-2xl text-ink">Identificación</h2>
      <p className="mt-1 text-sm leading-6 text-ink-2">Datos privados para mantener completo el carnet.</p>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveIdentity}>
        <Field id="carnet-nombre" label="Nombre" error={identityErrors.name}>{(f) => <input {...f} value={identity.name} maxLength={120} disabled={!editable} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} />}</Field>
        <Field id="carnet-especie" label="Especie" error={identityErrors.species}>{(f) => <select {...f} value={identity.species} disabled={!editable} onChange={(e) => setIdentity({ ...identity, species: e.target.value })}><option value="perro">Perro</option><option value="gato">Gato</option></select>}</Field>
        <Field id="carnet-nacimiento" label="Fecha de nacimiento" error={identityErrors.birthDate}>{(f) => <input {...f} type="date" max={today()} value={identity.birthDate} disabled={!editable} onChange={(e) => setIdentity({ ...identity, birthDate: e.target.value })} />}</Field>
        <Field id="carnet-raza" label="Raza" error={identityErrors.breed}>{(f) => <input {...f} maxLength={120} value={identity.breed} disabled={!editable} onChange={(e) => setIdentity({ ...identity, breed: e.target.value })} />}</Field>
        <Field id="carnet-genero" label="Sexo" error={identityErrors.gender}>{(f) => <select {...f} value={identity.gender} disabled={!editable} onChange={(e) => setIdentity({ ...identity, gender: e.target.value })}><option value="">Sin especificar</option><option value="macho">Macho</option><option value="hembra">Hembra</option></select>}</Field>
        <Field id="carnet-talla" label="Talla" error={identityErrors.size}>{(f) => <select {...f} value={identity.size} disabled={!editable} onChange={(e) => setIdentity({ ...identity, size: e.target.value })}><option value="">Sin especificar</option><option value="miniatura">Miniatura</option><option value="pequeno">Pequeña</option><option value="mediano">Mediana</option><option value="grande">Grande</option></select>}</Field>
        <Field id="carnet-color" label="Color" error={identityErrors.color}>{(f) => <input {...f} maxLength={120} value={identity.color} disabled={!editable} onChange={(e) => setIdentity({ ...identity, color: e.target.value })} />}</Field>
        <Field id="carnet-peso" label="Peso (kg)" error={identityErrors.weightKg}>{(f) => <input {...f} type="number" min="0.001" max="500" step="0.001" value={identity.weightKg} disabled={!editable} onChange={(e) => setIdentity({ ...identity, weightKg: e.target.value })} />}</Field>
        <Field id="carnet-esterilizado" label="Esterilización" error={identityErrors.sterilized}>{(f) => <select {...f} value={identity.sterilized} disabled={!editable} onChange={(e) => setIdentity({ ...identity, sterilized: e.target.value })}><option value="">Sin especificar</option><option value="true">Sí</option><option value="false">No</option></select>}</Field>
        <Field id="carnet-microchip" label="Microchip" error={identityErrors.microchip}>{(f) => <input {...f} maxLength={50} value={identity.microchip} disabled={!editable} onChange={(e) => setIdentity({ ...identity, microchip: e.target.value })} />}</Field>
        <div className="sm:col-span-2"><Field id="carnet-rasgos" label="Rasgos distintivos" help="Escribe un rasgo por línea; máximo 30." error={identityErrors.distinctiveTraits}>{(f) => <textarea {...f} rows={3} value={identity.distinctiveTraits} disabled={!editable} onChange={(e) => setIdentity({ ...identity, distinctiveTraits: e.target.value })} />}</Field></div>
        <div className="sm:col-span-2"><Field id="carnet-notas" label="Notas de identificación" error={identityErrors.identificationNotes}>{(f) => <textarea {...f} rows={3} maxLength={2000} value={identity.identificationNotes} disabled={!editable} onChange={(e) => setIdentity({ ...identity, identificationNotes: e.target.value })} />}</Field></div>
        {canEdit ? <div className="sm:col-span-2"><SubmitButton busy={busy === "identity"} busyLabel="Guardando…" icon={<Save size={16} />}>Guardar identificación</SubmitButton></div> : null}
      </form>
    </Surface>

    <Surface id="salud" as="section" size="lg" className="scroll-mt-24" rest={{ "aria-labelledby": "salud-titulo" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 id="salud-titulo" className="font-display text-2xl text-ink">Salud y cuidados</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-2">El historial queda privado salvo que actives su resumen en el perfil voluntario. La nota del QR se controla por separado.</p></div>
        <label className="flex max-w-sm items-start gap-3 rounded-md border border-rule bg-surface px-3 py-2.5 text-sm text-ink">
          <input type="checkbox" checked={privacy.showHealth} disabled={!editable} onChange={(event) => void toggleSectionVisibility("showHealth", event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-brand" />
          <span><span className="block font-medium">Mostrar el resumen de salud en el perfil público voluntario</span><span className="mt-0.5 block text-xs leading-5 text-ink-3">No activa la ficha ni comparte archivos clínicos.</span></span>
        </label>
      </div>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveHealth}>
        <Field id="salud-alergias" label="Alergias" help="Una por línea." error={healthErrors.allergies}>{(f) => <textarea {...f} rows={3} value={healthInput.allergies} disabled={!editable} onChange={(e) => setHealthInput({ ...healthInput, allergies: e.target.value })} />}</Field>
        <Field id="salud-condiciones" label="Condiciones" help="Una por línea." error={healthErrors.conditions}>{(f) => <textarea {...f} rows={3} value={healthInput.conditions} disabled={!editable} onChange={(e) => setHealthInput({ ...healthInput, conditions: e.target.value })} />}</Field>
        <Field id="salud-medicamentos" label="Medicamentos actuales" help="Uno por línea." error={healthErrors.medications}>{(f) => <textarea {...f} rows={3} value={healthInput.medications} disabled={!editable} onChange={(e) => setHealthInput({ ...healthInput, medications: e.target.value })} />}</Field>
        <Field id="salud-dieta" label="Dieta o alimentos que debe evitar" error={healthErrors.specialDiet}>{(f) => <textarea {...f} rows={3} maxLength={2000} value={healthInput.specialDiet} disabled={!editable} onChange={(e) => setHealthInput({ ...healthInput, specialDiet: e.target.value })} />}</Field>
        <Field id="salud-comportamiento" label="Comportamiento o cuidados" error={healthErrors.behavior}>{(f) => <textarea {...f} rows={3} maxLength={2000} value={healthInput.behavior} disabled={!editable} onChange={(e) => setHealthInput({ ...healthInput, behavior: e.target.value })} />}</Field>
        <Field id="salud-emergencia" label="Nota de cuidados de emergencia" help="La verá quien abra el QR de esta mascota." error={healthErrors.emergencyCareNote}>{(f) => <textarea {...f} rows={3} maxLength={2000} value={healthInput.emergencyCareNote} disabled={!editable} onChange={(e) => setHealthInput({ ...healthInput, emergencyCareNote: e.target.value })} />}</Field>
        {canEdit ? <div className="sm:col-span-2"><SubmitButton busy={busy === "health"} busyLabel="Guardando…" icon={<Save size={16} />}>Guardar salud y cuidados</SubmitButton></div> : null}
      </form>
    </Surface>

    <Surface id="vacunas" as="section" size="lg" className="scroll-mt-24" rest={{ "aria-labelledby": "vacunas-titulo" }}>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="vacunas-titulo" className="font-display text-2xl text-ink">Vacunas</h2><p className="mt-1 text-sm leading-6 text-ink-2">Registro ingresado por el dueño; PawPass no valida clínicamente las aplicaciones.</p></div><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink">{vaccines.length} {vaccines.length === 1 ? "registro" : "registros"}</span></div>
      {vaccines.length ? <ul className="mt-5 grid gap-3">{vaccines.map((vaccine) => <li key={vaccine.id} className="rounded-md border border-rule bg-surface px-4 py-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-ink">{vaccine.name}</h3><p className="mt-1 text-sm text-ink-2">Aplicada: {formatDate(vaccine.applicationDate)}{vaccine.nextDose ? ` · Próxima dosis: ${formatDate(vaccine.nextDose)}` : " · Próxima dosis sin registrar"}</p>{vaccine.batch ? <p className="mt-1 text-xs text-ink-3">Lote: {vaccine.batch}</p> : null}{vaccine.documentId ? <p className="mt-1 text-xs text-ink-3">Comprobante adjunto al carnet</p> : null}<label className="mt-3 flex items-start gap-2 text-xs text-ink-2"><input type="checkbox" checked={vaccine.visiblePublic} disabled={!editable} onChange={(event) => void toggleRecordVisibility("pet_vaccines", vaccine.id, event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-brand" />Compartir esta vacuna en el perfil público voluntario</label></div>{canEdit ? <div className="flex gap-2"><button type="button" className="text-sm font-semibold text-brand underline" onClick={() => editVaccine(vaccine)}>Editar</button><button type="button" className="text-sm font-semibold text-danger underline disabled:opacity-50" disabled={Boolean(busy)} onClick={() => void deleteVaccine(vaccine.id)}>{busy === `vaccine:${vaccine.id}` ? "Eliminando…" : "Eliminar"}</button></div> : null}</div></li>)}</ul> : <p className="mt-4 rounded-md bg-sunken px-4 py-3 text-sm text-ink-2">Aún no hay vacunas registradas.</p>}
      {canEdit ? <form className="mt-5 grid gap-4 border-t border-rule pt-5 sm:grid-cols-2" onSubmit={saveVaccine}><h3 className="sm:col-span-2 font-semibold text-ink">{editingVaccineId ? "Editar vacuna" : "Registrar vacuna"}</h3>
        <Field id="vacuna-nombre" label="Vacuna" error={vaccineErrors.name}>{(f) => <input {...f} maxLength={200} value={vaccineInput.name} disabled={!editable} onChange={(e) => setVaccineInput({ ...vaccineInput, name: e.target.value })} />}</Field>
        <Field id="vacuna-aplicacion" label="Fecha de aplicación" error={vaccineErrors.applicationDate}>{(f) => <input {...f} type="date" max={today()} value={vaccineInput.applicationDate} disabled={!editable} onChange={(e) => setVaccineInput({ ...vaccineInput, applicationDate: e.target.value })} />}</Field>
        <Field id="vacuna-proxima" label="Próxima dosis" error={vaccineErrors.nextDose}>{(f) => <input {...f} type="date" min={vaccineInput.applicationDate || undefined} value={vaccineInput.nextDose} disabled={!editable} onChange={(e) => setVaccineInput({ ...vaccineInput, nextDose: e.target.value })} />}</Field>
        <Field id="vacuna-lote" label="Lote" error={vaccineErrors.batch}>{(f) => <input {...f} maxLength={120} value={vaccineInput.batch} disabled={!editable} onChange={(e) => setVaccineInput({ ...vaccineInput, batch: e.target.value })} />}</Field>
        <div className="sm:col-span-2"><Field id="vacuna-documento" label="Comprobante" help="Opcional. Primero carga el comprobante en Fotos y documentos.">{(f) => <select {...f} value={vaccineInput.documentId} disabled={!editable} onChange={(e) => setVaccineInput({ ...vaccineInput, documentId: e.target.value })}><option value="">Sin comprobante</option>{documents.filter((doc) => doc.category === "vacunas").map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}</select>}</Field></div>
        <div className="flex flex-wrap gap-3 sm:col-span-2"><SubmitButton busy={busy === "vaccine"} busyLabel="Guardando…" icon={<Save size={16} />}>{editingVaccineId ? "Guardar cambios" : "Guardar vacuna"}</SubmitButton>{editingVaccineId ? <button type="button" className="text-sm font-semibold text-ink-2 underline" onClick={resetVaccine}>Cancelar edición</button> : null}</div>
      </form> : null}
    </Surface>

    <Surface id="documentos" as="section" size="lg" className="scroll-mt-24" rest={{ "aria-labelledby": "archivos-titulo" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"><FileText size={20} aria-hidden="true" /></span><div><h2 id="archivos-titulo" className="font-display text-2xl text-ink">Fotos y documentos</h2><p className="max-w-2xl text-sm leading-6 text-ink-2">Cada archivo sigue privado hasta que lo selecciones. El QR de rescate nunca muestra documentos.</p></div></div>
        {filePrivacySupported ? <label className="flex max-w-sm items-start gap-3 rounded-md border border-rule bg-surface px-3 py-2.5 text-sm text-ink">
          <input type="checkbox" checked={privacy.showFiles} disabled={!editable} onChange={(event) => void toggleSectionVisibility("showFiles", event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-brand" />
          <span><span className="block font-medium">Mostrar los archivos seleccionados en el perfil público voluntario</span><span className="mt-0.5 block text-xs leading-5 text-ink-3">Solo aparecen los que también tengan su permiso individual activado. Puedes ocultarlos todos sin perder esas selecciones.</span></span>
        </label> : <p className="max-w-sm rounded-md bg-sunken px-3 py-2.5 text-xs leading-5 text-ink-2">Los archivos del carnet siguen privados. El control para publicarlos estará disponible al actualizar la configuración.</p>}
      </div>
      {documents.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-2">{documents.map((document) => <li key={document.id} className="overflow-hidden rounded-md border border-rule bg-surface">{document.category === "foto" && document.signedUrl ? <Image src={document.signedUrl} alt={`Foto de ${pet.name}: ${document.name}`} width={800} height={600} unoptimized className="aspect-[4/3] w-full bg-sunken object-contain" /> : null}<div className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-brand">{categoryLabel(document.category)}</p><h3 className="mt-1 break-words font-semibold text-ink">{document.name}</h3><p className="mt-1 text-xs text-ink-3">{formatDate(document.date)} · {formatSize(document.size)}</p>{document.description ? <p className="mt-2 text-sm leading-5 text-ink-2">{document.description}</p> : null}{document.category !== "foto" && document.signedUrl ? <a href={document.signedUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand underline">Abrir archivo privado</a> : null}<label className="mt-3 flex items-start gap-2 text-xs text-ink-2"><input type="checkbox" checked={document.visiblePublic} disabled={!editable} onChange={(event) => void toggleRecordVisibility("pet_documents", document.id, event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-brand" />{document.category === "foto" ? "Compartir esta foto en el perfil público voluntario" : "Compartir este archivo en el perfil público voluntario"}</label></div>{canEdit ? <button type="button" title={`Eliminar ${document.name}`} aria-label={`Eliminar ${document.name}`} className="shrink-0 rounded-md p-2 text-danger hover:bg-danger-soft disabled:opacity-50" disabled={Boolean(busy)} onClick={() => void deleteDocument(document)}><Trash2 size={17} aria-hidden="true" /></button> : null}</div></li>)}</ul> : <p className="mt-4 rounded-md bg-sunken px-4 py-3 text-sm text-ink-2">Todavía no hay fotos ni documentos adicionales.</p>}
      {canEdit ? <form className="mt-6 grid gap-4 border-t border-rule pt-5 sm:grid-cols-2" onSubmit={saveFile}><div className="sm:col-span-2"><h3 className="font-semibold text-ink">Añadir archivo privado</h3><p className="mt-1 text-xs leading-5 text-ink-3">Fotos: JPEG, PNG o WebP hasta 5 MiB. Documentos: PDF o imagen hasta 10 MiB. Las fotos se mantienen privadas hasta que elijas compartirlas una por una.</p></div>
        <Field id="archivo-tipo" label="Tipo de archivo">{(f) => <select {...f} value={fileKind} disabled={Boolean(pendingUpload || busy)} onChange={(e) => { const kind = e.target.value as "foto" | "documento"; setFileKind(kind); if (kind === "foto") setFileCategory("foto"); else if (fileCategory === "foto") setFileCategory("identificacion"); }}><option value="foto">Foto</option><option value="documento">Documento</option></select>}</Field>
        {fileKind === "documento" ? <Field id="archivo-categoria" label="Categoría">{(f) => <select {...f} value={fileCategory} disabled={Boolean(pendingUpload || busy)} onChange={(e) => setFileCategory(e.target.value)}><option value="identificacion">Identificación</option><option value="salud">Salud</option><option value="vacunas">Vacunas</option><option value="otro">Otro</option></select>}</Field> : null}
        <Field id="archivo-nombre" label="Nombre del archivo">{(f) => <input {...f} maxLength={200} value={fileName} disabled={Boolean(pendingUpload || busy)} onChange={(e) => setFileName(e.target.value)} placeholder="Ej. Cartilla de vacunación" />}</Field>
        <Field id="archivo-fecha" label="Fecha del documento (opcional)">{(f) => <input {...f} type="date" value={fileDate} disabled={Boolean(pendingUpload || busy)} onChange={(e) => setFileDate(e.target.value)} />}</Field>
        <div className="sm:col-span-2"><Field id="archivo-descripcion" label="Descripción (opcional)">{(f) => <textarea {...f} rows={2} maxLength={2000} value={fileDescription} disabled={Boolean(pendingUpload || busy)} onChange={(e) => setFileDescription(e.target.value)} />}</Field></div>
        <div className="sm:col-span-2"><Field id="archivo-file" label={fileKind === "foto" ? "Seleccionar foto" : "Seleccionar documento"}>{(f) => <input {...f} type="file" accept={fileKind === "foto" ? "image/jpeg,image/png,image/webp" : "application/pdf,image/jpeg,image/png,image/webp"} disabled={Boolean(pendingUpload || busy)} onChange={(e) => { const selected = e.target.files?.[0] ?? null; setFile(selected); if (selected) setFileName(selected.name.slice(0, 200)); }} />}</Field></div>
        {pendingUpload ? <p className="sm:col-span-2 rounded-md bg-warning-soft px-3.5 py-3 text-sm text-ink" role="status">El archivo está registrado y falta terminar la carga. Puedes reintentar sin crear otro registro.</p> : null}
        <div className="sm:col-span-2"><SubmitButton busy={busy === "file"} busyLabel={pendingUpload ? "Reintentando…" : "Guardando…"} icon={fileKind === "foto" ? <ImagePlus size={16} /> : <Upload size={16} />}>{pendingUpload ? "Reintentar carga" : "Guardar archivo privado"}</SubmitButton></div>
      </form> : null}
    </Surface>

    {error ? <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-3 text-sm leading-6 text-danger">{error}</p> : null}
    {notice ? <p role="status" className="rounded-md bg-success-soft px-3.5 py-3 text-sm leading-6 text-success"><PawPrint className="mr-2 inline" size={16} aria-hidden="true" />{notice}</p> : null}
  </div>;
}
