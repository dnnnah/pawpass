"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, LockKeyhole, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import {
  loadPetSettings,
  updatePetContact,
  updatePetPrivacy,
  type PetContact,
  type PetPrivacy,
  type PetSettingsClient,
} from "@/lib/account/petSettings";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

type PetSettingsFormProps = {
  petId: string;
  petName: string;
  canEdit: boolean;
  showPrivacySettings?: boolean;
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

const privacyFields: Array<{ key: keyof PetPrivacy; label: string; help?: string }> = [
  { key: "published", label: "Publicar la ficha QR", help: "Permite que el código público muestre la información consentida." },
  { key: "showContactName", label: "Mostrar nombre de contacto" },
  { key: "showPhone", label: "Mostrar teléfono" },
  { key: "showWhatsapp", label: "Mostrar WhatsApp" },
  { key: "showSecondaryPhone", label: "Mostrar teléfono secundario" },
  { key: "showEmail", label: "Mostrar correo" },
  { key: "showZone", label: "Mostrar zona" },
  { key: "showHealth", label: "Mostrar salud" },
  { key: "showVeterinarian", label: "Mostrar veterinario" },
  { key: "showVetAddress", label: "Mostrar dirección del veterinario" },
  { key: "showEmergency", label: "Mostrar instrucciones de emergencia" },
  { key: "showMicrochip", label: "Mostrar microchip" },
  { key: "listInCatalog", label: "Incluir en el catálogo de adopción" },
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
  showVeterinarian: false,
  showVetAddress: false,
  showEmergency: false,
  showMicrochip: false,
  listInCatalog: false,
};

function asSettingsClient(): PetSettingsClient {
  return createSupabaseBrowserClient() as unknown as PetSettingsClient;
}

export function PetSettingsForm({ petId, petName, canEdit, showPrivacySettings = true }: PetSettingsFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [contact, setContact] = useState<PetContact | null>(null);
  const [privacy, setPrivacy] = useState<PetPrivacy>(defaultPrivacy);
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
    }
    setLoading(false);
  }

  async function saveContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contact || !canEdit) return;

    setSavingContact(true);
    setError(null);
    setNotice(null);
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
    else setNotice("Privacidad guardada.");
    setSavingPrivacy(false);
  }

  return (
    <div className="mt-4 border-t border-rule pt-4">
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

              <Surface as="section" variant="sunken" size="sm" rest={{ "aria-labelledby": `${petId}-contacto-titulo` }}>
                <h4 id={`${petId}-contacto-titulo`} className="font-semibold text-ink">Contacto de emergencia</h4>
                <form className="mt-4 grid gap-3" onSubmit={saveContact}>
                  {contactFields.map(({ key, label, type = "text" }) => (
                    <Field key={key} id={`${petId}-${key}`} label={label}>
                      {(field) => (
                        <input
                          {...field}
                          type={type}
                          value={contact[key]}
                          disabled={!canEdit || savingContact}
                          onChange={(event) => setContact((current) => current ? { ...current, [key]: event.target.value } : current)}
                        />
                      )}
                    </Field>
                  ))}
                  {canEdit ? (
                    <SubmitButton busy={savingContact} busyLabel="Guardando…" icon={<Save size={16} />}>
                      Guardar contacto
                    </SubmitButton>
                  ) : null}
                </form>
              </Surface>

              {showPrivacySettings ? <Surface as="section" variant="sunken" size="sm" rest={{ "aria-labelledby": `${petId}-privacidad-titulo` }}>
                <h4 id={`${petId}-privacidad-titulo`} className="font-semibold text-ink">Qué puede mostrar la ficha</h4>
                <form className="mt-4 grid gap-2" onSubmit={savePrivacy}>
                  {privacyFields.map(({ key, label, help }) => (
                    <label key={key} className="flex items-start gap-3 rounded-md border border-rule bg-surface px-3 py-2.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={privacy[key]}
                        disabled={!canEdit || savingPrivacy}
                        onChange={(event) => setPrivacy((current) => ({ ...current, [key]: event.target.checked }))}
                        className="mt-0.5 size-4 shrink-0 accent-brand"
                      />
                      <span>
                        <span className="flex items-center gap-1.5 font-medium">
                          {label}
                          {privacy[key] ? <Check size={14} className="text-success" aria-hidden="true" /> : null}
                        </span>
                        {help ? <span className="mt-0.5 block text-xs leading-5 text-ink-3">{help}</span> : null}
                      </span>
                    </label>
                  ))}
                  {canEdit ? (
                    <SubmitButton busy={savingPrivacy} busyLabel="Guardando…" icon={<Save size={16} />}>
                      Guardar privacidad
                    </SubmitButton>
                  ) : null}
                </form>
              </Surface> : null}

              {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
              {notice ? <p className="text-sm text-success" role="status">{notice}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
