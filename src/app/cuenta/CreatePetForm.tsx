"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CalendarPlus, PawPrint, Upload } from "lucide-react";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import {
  createAccountPet,
  PHOTO_UPLOAD_ERROR,
  uploadAccountPetPhoto,
  validateCreatePetInput,
  type CreatePetErrors,
  type CreatePetInput,
  type CreatePetResult,
} from "@/lib/account/createPet";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

const initialInput: CreatePetInput = {
  name: "",
  species: "",
  birthDate: "",
  contactMethod: "phone",
  contactValue: "",
  photo: null,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreatePetForm() {
  const router = useRouter();
  const [input, setInput] = useState<CreatePetInput>(initialInput);
  const [errors, setErrors] = useState<CreatePetErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<CreatePetResult | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const photoPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    };
  }, []);

  function selectPhoto(file: File | null) {
    if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    const preview = file ? URL.createObjectURL(file) : null;
    photoPreviewRef.current = preview;
    setPhotoPreview(preview);
    setInput((current) => ({ ...current, photo: file }));
    setErrors((current) => ({ ...current, photo: undefined }));
  }

  function updateField(field: keyof CreatePetInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setSuccess(null);

    if (!pendingUpload) {
      const nextErrors = validateCreatePetInput(input);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }

    if (!hasSupabaseEnv()) {
      setServerError("La cuenta todavía no está conectada a Supabase.");
      return;
    }

    setBusy(true);
    let createdPet = pendingUpload;
    try {
      const supabase = createSupabaseBrowserClient();
      const pet = pendingUpload ?? await createAccountPet(
        {
          rpc: async (functionName, params) => {
            const response = await supabase.rpc(functionName, params);
            return { data: response.data, error: response.error };
          },
        },
        input,
      );

      if (pet.error || !input.photo) {
        setServerError(pet.error ?? "Selecciona una foto para continuar.");
        return;
      }

      createdPet = pet;
      setPendingUpload(pet);
      const uploadError = await uploadAccountPetPhoto(
        { upload: async (path, photo) => {
          const response = await supabase.storage.from("pawpass-fotos").upload(path, photo, {
            contentType: photo.type,
            upsert: true,
          });
          return { error: response.error };
        } },
        pet,
        input.photo,
      );

      if (uploadError) {
        setServerError(PHOTO_UPLOAD_ERROR);
        return;
      }

      selectPhoto(null);
      setInput(initialInput);
      setErrors({});
      setPendingUpload(null);
      setPhotoInputKey((current) => current + 1);
      setSuccess("Mascota registrada. Su foto quedó guardada de forma privada.");
      router.refresh();
    } catch {
      setServerError(createdPet ? PHOTO_UPLOAD_ERROR : "No pudimos registrar la mascota. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface as="section" variant="outline" size="md" rest={{ "aria-labelledby": "registrar-mascota-titulo" }}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
          <PawPrint size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 id="registrar-mascota-titulo" className="font-display text-xl text-ink">Registrar una mascota</h2>
          <p className="mt-1 text-sm leading-6 text-ink-2">
            Solo pedimos los datos necesarios para crear su carnet. Puedes completar el resto después.
          </p>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit} noValidate>
        <Field id="pet-name" label="Nombre" error={errors.name}>
          {(field) => <input {...field} type="text" autoComplete="off" maxLength={120} disabled={Boolean(pendingUpload)} value={input.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ej. Nala" />}
        </Field>

        <Field id="pet-species" label="Especie" error={errors.species}>
          {(field) => (
            <select {...field} disabled={Boolean(pendingUpload)} value={input.species} onChange={(event) => updateField("species", event.target.value)}>
              <option value="">Selecciona una opción</option>
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
            </select>
          )}
        </Field>

        <Field id="pet-birth-date" label="Fecha de nacimiento" error={errors.birthDate}>
          {(field) => <input {...field} type="date" max={today()} disabled={Boolean(pendingUpload)} value={input.birthDate} onChange={(event) => updateField("birthDate", event.target.value)} />}
        </Field>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-ink">¿Cómo pueden contactarte?</legend>
          <div className="grid grid-cols-3 gap-2">
            {([ ["phone", "Teléfono"], ["whatsapp", "WhatsApp"], ["email", "Correo"] ] as const).map(([value, label]) => (
              <label key={value} className={`flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-2 text-xs font-semibold ${input.contactMethod === value ? "border-brand bg-brand-soft text-brand-ink" : "border-rule bg-surface text-ink-2"}`}>
                <input className="sr-only" type="radio" name="contact-method" value={value} disabled={Boolean(pendingUpload)} checked={input.contactMethod === value} onChange={() => updateField("contactMethod", value)} />
                {label}
              </label>
            ))}
          </div>
          <Field id="contact-value" label={input.contactMethod === "email" ? "Correo de contacto" : input.contactMethod === "whatsapp" ? "Número de WhatsApp" : "Teléfono de contacto"} error={errors.contactValue}>
            {(field) => <input {...field} type={input.contactMethod === "email" ? "email" : "tel"} disabled={Boolean(pendingUpload)} autoComplete={input.contactMethod === "email" ? "email" : "tel"} inputMode={input.contactMethod === "email" ? "email" : "tel"} value={input.contactValue} onChange={(event) => updateField("contactValue", event.target.value)} placeholder={input.contactMethod === "email" ? "tu@correo.com" : "+52 55 1234 5678"} />}
          </Field>
        </fieldset>

        <Field id="pet-photo" label="Foto" error={errors.photo} help="JPEG, PNG o WebP. Máximo 5 MiB. Se guarda de forma privada.">
          {(field) => <input key={photoInputKey} {...field} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || Boolean(pendingUpload)} onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />}
        </Field>

        {photoPreview ? <Image src={photoPreview} alt="Vista previa de la foto elegida" width={640} height={480} unoptimized className="max-h-48 w-full rounded-md object-cover" /> : null}

        {serverError ? <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-3 text-sm leading-6 text-danger">{serverError}</p> : null}
        {success ? <p role="status" className="rounded-md bg-success-soft px-3.5 py-3 text-sm leading-6 text-success">{success}</p> : null}

        <SubmitButton busy={busy} busyLabel={pendingUpload ? "Subiendo foto…" : "Registrando…"} icon={pendingUpload ? <Upload size={17} /> : <CalendarPlus size={17} />}>
          {pendingUpload ? "Reintentar foto" : "Registrar mascota"}
        </SubmitButton>
      </form>
    </Surface>
  );
}
