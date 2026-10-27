"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, LockKeyhole, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, SubmitButton } from "@/components/ui/Field";
import {
  loadPetSettings,
  updatePetContact,
  updatePetPrivacy,
  validateQrContact,
  type PetContact,
  type PetPrivacy,
  type PetSettingsClient,
} from "@/lib/account/petSettings";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

type PetSettingsFormProps = {
  petId: string;
  petName: string;
  publicCode?: string;
  canEdit: boolean;
  showPrivacySettings?: boolean;
  initialPublished?: boolean;
};

const contactFields: Array<{ key: keyof PetContact; label: string; type?: "email" | "tel" | "text" }> = [
  { key: "publicName", label: "Nombre de contacto" },
  { key: "phone", label: "Teléfono principal", type: "tel" },
  { key: "whatsapp", label: "WhatsApp", type: "tel" },
  { key: "secondaryPhone", label: "Teléfono secundario", type: "tel" },
  { key: "email", label: "Correo de contacto", type: "email" },
  { key: "safeZone", label: "Zona segura" },
  { key: "usualZone", label: "Zona habitual" },
  { key: "whatsappMessage", label: "Mensaje para WhatsApp" },
];

const privacyFields: Array<{ key: Exclude<keyof PetPrivacy, "showFiles" | "showHealth">; label: string; help?: string }> = [
  { key: "published", label: "Activar perfil público voluntario", help: "La mascota aparecerá en los perfiles públicos. Salud, vacunas y archivos se controlan por separado; cada vacuna y archivo necesita su propio permiso." },
  { key: "showContactName", label: "Mostrar el nombre del contacto" },
  { key: "showPhone", label: "Mostrar también el teléfono principal", help: "Este dato solo se compartirá cuando actives su publicación." },
  { key: "showWhatsapp", label: "Mostrar también WhatsApp" },
  { key: "showSecondaryPhone", label: "Mostrar el teléfono secundario" },
  { key: "showEmail", label: "Mostrar también el correo" },
  { key: "showZone", label: "Mostrar zona aproximada en el perfil público" },
  { key: "showEmergency", label: "Mostrar la nota de emergencia en el perfil voluntario", help: "Esta opción no cambia la nota que aparece en el QR de rescate." },
  { key: "showMicrochip", label: "Mostrar el número de microchip" },
];

const defaultPrivacy: PetPrivacy = {
  published: false,
  showContactName: false,
  showPhone: false,
  showWhatsapp: false,
  showSecondaryPhone: false,
  showEmail: false,
  showZone: false,
  showHealth: false,
  showFiles: false,
  showVeterinarian: false,
  showVetAddress: false,
  showEmergency: false,
  showMicrochip: false,
  listInCatalog: false,
};

function asSettingsClient(): PetSettingsClient {
  return createSupabaseBrowserClient() as unknown as PetSettingsClient;
}

export function PetSettingsForm({ petId, petName, publicCode, canEdit, showPrivacySettings = true, initialPublished = false }: PetSettingsFormProps) {
  const [open, setOpen] = useState(false);
  const [contactSectionOpen, setContactSectionOpen] = useState(true);
  const [privacySectionOpen, setPrivacySectionOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [contact, setContact] = useState<PetContact | null>(null);
  const [privacy, setPrivacy] = useState<PetPrivacy>(defaultPrivacy);
  const [savedPublished, setSavedPublished] = useState(initialPublished);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function toggleEditor() {
    setOpen((value) => !value);
    if (open || contact || loading) return;

    if (!hasSupabaseEnv()) {
      setError("La configuración de la ficha necesita Supabase.");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await loadPetSettings(asSettingsClient(), petId);
    if (result.error) {
      setError(result.error);
    } else {
      setContact(result.contact);
      setPrivacy(result.privacy);
      setSavedPublished(result.privacy.published);
    }
    setLoading(false);
  }

  async function openPrivacyEditor() {
    setOpen(true);
    setPrivacySectionOpen(true);
    if (contact || loading) return;

    if (!hasSupabaseEnv()) {
      setError("La configuración de la ficha necesita Supabase.");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await loadPetSettings(asSettingsClient(), petId);
    if (result.error) {
      setError(result.error);
    } else {
      setContact(result.contact);
      setPrivacy(result.privacy);
      setSavedPublished(result.privacy.published);
    }
    setLoading(false);
  }

  async function saveContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contact || !canEdit) return;

    setSavingContact(true);
    setError(null);
    setNotice(null);
    const contactError = validateQrContact(contact);
    if (contactError) {
      setError(contactError);
      setSavingContact(false);
      return;
    }
    const result = await updatePetContact(asSettingsClient(), petId, contact);
    if (result) setError(result);
    else setNotice("Contacto guardado.");
    setSavingContact(false);
  }

  async function savePrivacy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    setSavingPrivacy(true);
    setError(null);
    setNotice(null);
    const result = await updatePetPrivacy(asSettingsClient(), petId, privacy);
    if (result) setError(result);
    else { setSavedPublished(privacy.published); setNotice("Privacidad guardada."); }
    setSavingPrivacy(false);
  }

  return (
    <div id="perfil-publico" className="mt-4 min-w-0 border-t border-rule pt-4">
      {showPrivacySettings ? <div className="mb-3 min-w-0 rounded-md bg-sunken p-3">
        <p className="text-sm font-semibold text-ink">Perfil público voluntario · {savedPublished ? "Activo" : "Inactivo"}</p>
        <p className="mt-1 text-xs leading-5 text-ink-2">Tú eliges qué datos, fotos y archivos autorizas. Esta opción no cambia el carnet privado ni el enlace QR.</p>
        {savedPublished && publicCode ? <Link href={`/perfil/${encodeURIComponent(publicCode)}`} className="mt-2 flex min-h-11 min-w-0 max-w-full items-center rounded-sm text-sm font-semibold text-brand underline [overflow-wrap:anywhere]">Abrir perfil público de {petName}</Link> : null}
        {canEdit && showPrivacySettings ? <Button type="button" variant="secondary" size="sm" className="mt-2" disabled={loading} onClick={() => void openPrivacyEditor()}>
          {savedPublished ? "Editar qué compartes" : "Activar y elegir qué compartir"}
        </Button> : null}
      </div> : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void toggleEditor()}
        icon={open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        ariaLabel={`${open ? "Ocultar" : "Configurar"} ficha de ${petName}`}
      >
        {open ? "Ocultar configuración" : "Configurar ficha"}
      </Button>

      {open ? (
        <div className="mt-4 grid gap-4">
          {loading ? (
            <p className="text-sm text-ink-2" role="status">
              Cargando configuración…
            </p>
          ) : error && !contact ? (
            <p className="rounded-md bg-danger-soft px-3.5 py-3 text-sm leading-6 text-danger" role="alert">
              {error}
            </p>
          ) : contact ? (
            <>
              {!canEdit ? (
                <p className="flex items-start gap-2 rounded-md bg-sunken px-3.5 py-3 text-xs leading-5 text-ink-2">
                  <LockKeyhole size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  Solo la persona administradora puede editar esta configuración.
                </p>
              ) : null}

              <details open={contactSectionOpen} onToggle={(event) => setContactSectionOpen(event.currentTarget.open)} className="border-y border-rule py-3">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                  <span><span className="block font-semibold text-ink">Contacto del QR</span><span className="mt-0.5 block text-xs leading-5 text-ink-3">Elige cómo te contactarán si encuentran a {petName}.</span></span>
                  {contactSectionOpen ? <ChevronUp size={17} className="shrink-0 text-brand" aria-hidden="true" /> : <ChevronDown size={17} className="shrink-0 text-brand" aria-hidden="true" />}
                </summary>
                <div className="mt-4 grid gap-4">
                  <p className="text-sm leading-5 text-ink-2">El canal seleccionado aparecerá en el QR de rescate. Los otros datos solo se publican si los autorizas en Privacidad.</p>
                  <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveContact}>
                    <Field id={`${petId}-contact-method`} label="Canal que aparecerá en el QR" className="sm:col-span-2">
                      {(field) => <select {...field} value={contact.contactMethod} disabled={!canEdit || savingContact} onChange={(event) => setContact((current) => current ? { ...current, contactMethod: event.target.value as PetContact["contactMethod"] } : current)}>
                        <option value="">Elige un canal</option><option value="phone">Teléfono</option><option value="whatsapp">WhatsApp</option><option value="email">Correo</option>
                      </select>}
                    </Field>
                    {contactFields.map(({ key, label, type = "text" }) => (
                      <Field key={key} id={`${petId}-${key}`} label={label}>
                        {(field) => <input {...field} type={type} value={contact[key]} disabled={!canEdit || savingContact} onChange={(event) => setContact((current) => current ? { ...current, [key]: event.target.value } : current)} />}
                      </Field>
                    ))}
                    {canEdit ? <SubmitButton busy={savingContact} busyLabel="Guardando…" icon={<Save size={16} />} className="sm:col-span-2">Guardar contacto del QR</SubmitButton> : null}
                  </form>
                </div>
              </details>

              {showPrivacySettings ? <details open={privacySectionOpen} onToggle={(event) => setPrivacySectionOpen(event.currentTarget.open)} className="border-b border-rule py-3">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                  <span><span className="block font-semibold text-ink">Privacidad del perfil público</span><span className="mt-0.5 block text-xs leading-5 text-ink-3">Decide qué información voluntaria se puede consultar.</span></span>
                  {privacySectionOpen ? <ChevronUp size={17} className="shrink-0 text-brand" aria-hidden="true" /> : <ChevronDown size={17} className="shrink-0 text-brand" aria-hidden="true" />}
                </summary>
                <div className="mt-4">
                  {savedPublished && publicCode ? <Link href={`/perfil/${encodeURIComponent(publicCode)}`} target="_blank" rel="noreferrer" className="inline-block min-h-11 rounded-sm py-2 text-sm font-semibold text-brand underline">Vista previa del perfil de {petName}</Link>
                    : <p className="mb-4 rounded-md bg-sunken px-3 py-2 text-sm leading-5 text-ink-2">El perfil voluntario está privado hasta que actives esta opción y guardes los cambios.</p>}
                  <form className="grid gap-2" onSubmit={savePrivacy}>
                    {privacyFields.map(({ key, label, help }) => (
                      <label key={key} className="flex items-start gap-3 rounded-md border border-rule bg-surface px-3 py-2.5 text-sm text-ink">
                        <input type="checkbox" checked={privacy[key]} disabled={!canEdit || savingPrivacy} onChange={(event) => setPrivacy((current) => ({ ...current, [key]: event.target.checked }))} className="mt-0.5 size-4 shrink-0 accent-brand" />
                        <span><span className="flex items-center gap-1.5 font-medium">{label}{privacy[key] ? <Check size={14} className="text-success" aria-hidden="true" /> : null}</span>{help ? <span className="mt-0.5 block text-xs leading-5 text-ink-3">{help}</span> : null}</span>
                      </label>
                    ))}
                    {canEdit ? <SubmitButton busy={savingPrivacy} busyLabel="Guardando…" icon={<Save size={16} />}>Guardar privacidad</SubmitButton> : null}
                  </form>
                </div>
              </details> : null}

              {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
              {notice ? <p className="text-sm text-success" role="status">{notice}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
