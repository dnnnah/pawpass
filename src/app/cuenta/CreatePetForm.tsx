"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, PawPrint } from "lucide-react";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import {
  createAccountPet,
  validateCreatePetInput,
  type CreatePetErrors,
  type CreatePetInput,
} from "@/lib/account/createPet";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

const initialInput: CreatePetInput = {
  name: "",
  species: "",
  birthDate: "",
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

    const nextErrors = validateCreatePetInput(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!hasSupabaseEnv()) {
      setServerError("La cuenta todavía no está conectada a Supabase.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const result = await createAccountPet(
        {
          rpc: async (functionName, params) => {
            const response = await supabase.rpc(functionName, params);
            return { data: response.data, error: response.error };
          },
        },
        input,
      );

      if (result.error) {
        setServerError(result.error);
        return;
      }

      setInput(initialInput);
      setErrors({});
      setSuccess("Mascota registrada. Ya puedes abrir su ficha pública desde la lista.");
      router.refresh();
    } catch {
      setServerError("No pudimos registrar la mascota. Intenta de nuevo.");
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
          <h2 id="registrar-mascota-titulo" className="font-display text-xl text-ink">
            Registrar una mascota
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-2">
            Crea su identidad en PawPass y después completa sus datos de contacto y salud.
          </p>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit} noValidate>
        <Field id="pet-name" label="Nombre" error={errors.name}>
          {(field) => (
            <input
              {...field}
              type="text"
              autoComplete="off"
              maxLength={120}
              value={input.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ej. Nala"
            />
          )}
        </Field>

        <Field id="pet-species" label="Especie" error={errors.species}>
          {(field) => (
            <select
              {...field}
              value={input.species}
              onChange={(event) => updateField("species", event.target.value)}
            >
              <option value="">Selecciona una opción</option>
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
            </select>
          )}
        </Field>

        <Field id="pet-birth-date" label="Fecha de nacimiento" optional error={errors.birthDate}>
          {(field) => (
            <input
              {...field}
              type="date"
              max={today()}
              value={input.birthDate}
              onChange={(event) => updateField("birthDate", event.target.value)}
            />
          )}
        </Field>

        {serverError ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-3 text-sm leading-6 text-danger">
            {serverError}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="rounded-md bg-success-soft px-3.5 py-3 text-sm leading-6 text-success">
            {success}
          </p>
        ) : null}

        <SubmitButton busy={busy} busyLabel="Registrando…" icon={<CalendarPlus size={17} />}>
          Registrar mascota
        </SubmitButton>
      </form>
    </Surface>
  );
}
