"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CalendarPlus, PawPrint, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  const [successPetId, setSuccessPetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<CreatePetResult | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const photoPreviewRef = useRef<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
    setSuccessPetId(null);
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
      setSuccessPetId(pet.id);
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

      <form className="mt-5 grid gap-5" onSubmit={handleSubmit} noValidate>
        <fieldset className="grid gap-4 border-t border-rule pt-4 sm:grid-cols-2">
          <legend className="px-1 font-semibold text-ink">Datos de la mascota</legend>
          <p className="text-sm leading-5 text-ink-2 sm:col-span-2">Estos datos son necesarios para crear su carnet privado.</p>
          <Field id="pet-name" label="Nombre" error={errors.name}>
            {(field) => <input {...field} ref={nameInputRef} type="text" autoComplete="off" maxLength={120} disabled={Boolean(pendingUpload)} value={input.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ej. Nala" />}
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
          <Field id="pet-birth-date" label="Fecha de nacimiento" error={errors.birthDate} help="Usa la fecha aproximada si no conoces el día exacto.">
            {(field) => <input {...field} type="date" max={today()} disabled={Boolean(pendingUpload)} value={input.birthDate} onChange={(event) => updateField("birthDate", event.target.value)} />}
          </Field>
        </fieldset>

        <fieldset className="grid gap-4 border-t border-rule pt-4">
          <legend className="px-1 font-semibold text-ink">Contacto de emergencia y foto</legend>
          <p className="text-sm leading-5 text-ink-2">El contacto aparece en el QR para que puedan avisarte si encuentran a tu mascota. La foto se guarda privada.</p>
          <div className="grid gap-3">
            <p className="text-sm font-medium text-ink-2">¿Cómo pueden contactarte?</p>
            <div className="grid grid-cols-3 gap-2">
              {([ ["phone", "Teléfono"], ["whatsapp", "WhatsApp"], ["email", "Correo"] ] as const).map(([value, label]) => (
                <label key={value} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-2 text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${input.contactMethod === value ? "border-brand bg-brand-soft text-brand-ink" : "border-edge bg-surface text-ink-2"}`}>
                  <input className="sr-only" type="radio" name="contact-method" value={value} disabled={Boolean(pendingUpload)} checked={input.contactMethod === value} onChange={() => updateField("contactMethod", value)} />
                  {label}
                </label>
              ))}
            </div>
            <Field id="contact-value" label={input.contactMethod === "email" ? "Correo de contacto" : input.contactMethod === "whatsapp" ? "Número de WhatsApp" : "Teléfono de contacto"} error={errors.contactValue}>
              {(field) => <input {...field} type={input.contactMethod === "email" ? "email" : "tel"} disabled={Boolean(pendingUpload)} autoComplete={input.contactMethod === "email" ? "email" : "tel"} inputMode={input.contactMethod === "email" ? "email" : "tel"} value={input.contactValue} onChange={(event) => updateField("contactValue", event.target.value)} placeholder={input.contactMethod === "email" ? "tu@correo.com" : "+52 55 1234 5678"} />}
            </Field>
          </div>
          <Field id="pet-photo" label="Foto de perfil" error={errors.photo} help="JPEG, PNG o WebP; máximo 5 MiB. La vista previa muestra la foto completa.">
            {(field) => <input key={photoInputKey} {...field} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || Boolean(pendingUpload)} onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />}
          </Field>
          {photoPreview ? <Image src={photoPreview} alt="Vista previa completa de la foto elegida" width={640} height={480} unoptimized className="aspect-[4/3] w-full rounded-md bg-sunken object-contain" /> : null}
          {pendingUpload ? <p role="status" className="rounded-md bg-warning-soft px-3.5 py-3 text-sm leading-5 text-ink">El carnet ya se creó. Solo falta subir la foto; pulsa “Reintentar foto” para terminar.</p> : null}
        </fieldset>

        {serverError ? <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-3 text-sm leading-6 text-danger">{serverError}</p> : null}
        {success ? <div role="status" className="grid gap-3 rounded-md bg-success-soft px-3.5 py-3 text-sm leading-6 text-success">
          <p>{success}</p>
          <div className="flex flex-wrap items-center gap-3">
            {successPetId ? <Button href={`/cuenta/mascotas/${encodeURIComponent(successPetId)}`} size="sm">Abrir carnet privado</Button> : null}
            <button type="button" onClick={() => { setSuccess(null); setSuccessPetId(null); nameInputRef.current?.focus(); }} className="min-h-9 px-2 text-sm font-semibold text-brand underline">Registrar otra mascota</button>
          </div>
        </div> : null}

        <SubmitButton busy={busy} busyLabel={pendingUpload ? "Subiendo foto…" : "Creando carnet…"} icon={pendingUpload ? <Upload size={17} /> : <CalendarPlus size={17} />}>
          {pendingUpload ? "Reintentar foto" : "Crear carnet privado"}
        </SubmitButton>
      </form>
    </Surface>
  );
}
