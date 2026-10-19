"use client";

import { useRef, useState } from "react";
import { HeartHandshake, Send } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";
import { validateAdoptionRequest } from "@/lib/domain/adoption";
import {
  buildAdoptionRequestDraft,
  buildAdoptionRequestFromDraft,
  mapAdoptionValidationErrors,
  todayInMexicoISO,
  type AdoptionFormValues,
  type AdoptionFieldError,
} from "@/lib/adoptionRequestForm";
import { formatMexicanDate } from "@/lib/dateFormat";
import { useLostAlerts } from "@/lib/useLostAlerts";
import { useAdoptionRequests } from "@/lib/useAdoptionRequests";
import { trackAdoptionRequestStarted } from "@/lib/services/telemetry/trackers";
import { useTelemetryOnMount } from "@/components/telemetry/use-telemetry-on-mount";
import type { AdoptionRequest } from "@/types/adoption";
import type { PetProfile } from "@/types/pet";

type AdoptionRequestFormProps = {
  pet: PetProfile;
  shelterName?: string | null;
};

export function AdoptionRequestForm({ pet, shelterName = null }: AdoptionRequestFormProps) {
  /* Una solicitud empieza cuando la persona entra al formulario, no cuando lo
     envía. Se mide en el montaje y una sola vez, con el mismo guardia que el
     resto de entradas a la UI. El evento dice `form` y nada más: no el nombre,
     ni el teléfono, ni el correo, ni el motivo, ni las notas. */
  useTelemetryOnMount(() => {
    trackAdoptionRequestStarted("form");
  });

  const [values, setValues] = useState<AdoptionFormValues>({
    nombre: "",
    telefono: "",
    email: "",
    motivo: "",
    notas: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AdoptionFieldError, string>>>({});
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [phase, setPhase] = useState<"form" | "sending" | "success">("form");
  const [submitted, setSubmitted] = useState<AdoptionRequest | null>(null);

  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const motivoRef = useRef<HTMLTextAreaElement>(null);

  const fieldRefs = {
    nombre: nombreRef,
    telefono: telefonoRef,
    email: emailRef,
    motivo: motivoRef,
  } as const;

  const FIELD_ORDER: AdoptionFieldError[] = ["nombre", "telefono", "email", "motivo"];

  const { alert } = useLostAlerts(pet.id);
  const { requests, submit } = useAdoptionRequests(pet.id);

  const petName = pet.mascota.nombre;
  const viaText = shelterName ? `A través del refugio ${shelterName}` : "Adopción directa";

  function handleChange(field: keyof AdoptionFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!(field in current)) {
        return current;
      }
      const next = { ...current };
      delete next[field as AdoptionFieldError];
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (phase === "sending") {
      return;
    }

    const draft = buildAdoptionRequestDraft(pet.id, todayInMexicoISO(), values);
    const validation = validateAdoptionRequest({ pet, alert, draft });

    if (!validation.valid) {
      const mapped = mapAdoptionValidationErrors(validation.errors);
      setFieldErrors(mapped.fields);
      setGeneralErrors(mapped.general);
      setPhase("form");

      const firstInvalid = FIELD_ORDER.find((field) => mapped.fields[field] !== undefined);
      const target = firstInvalid ? fieldRefs[firstInvalid].current : null;
      if (target) {
        target.focus();
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return;
    }

    setFieldErrors({});
    setGeneralErrors([]);
    setPhase("sending");

    const seed =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}`;
    const request = buildAdoptionRequestFromDraft(draft, seed);

    window.setTimeout(() => {
      submit(request);
      setSubmitted(request);
      setPhase("success");
    }, 900);
  }

  if (phase === "success" && submitted) {
    const formattedDate = formatMexicanDate(submitted.fechaEnviada) ?? submitted.fechaEnviada;

    return (
      <Surface className="p-6 sm:p-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-adoption">
            Adopción
          </p>
          <h2 className="mt-2 font-display text-2xl leading-snug text-ink sm:text-3xl">
            Solicitud registrada
          </h2>
          <p className="mt-2.5 text-sm leading-6 text-ink-2">
            Gracias por querer darle un hogar a {petName}. Registramos tu solicitud con el estado{" "}
            <strong className="font-semibold text-ink">Enviada</strong>.
          </p>

          <dl className="mt-6 divide-y divide-rule border-y border-rule">
            {[
              ["Folio", submitted.id],
              ["Fecha", formattedDate],
              ["Mascota", petName],
              ["A través de", shelterName ?? "Adopción directa"],
            ].map(([term, value]) => (
              <div key={term} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-sm text-ink-2">{term}</dt>
                <dd className="text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-sm text-ink-2">Estado</dt>
              <dd>
                <Pill tone="adoption" size="sm">
                  Enviada
                </Pill>
              </dd>
            </div>
          </dl>

          <p className="mt-5 rounded-md border border-dashed border-rule-strong bg-sunken p-4 text-xs leading-5 text-ink-2">
            Esto es un prototipo: tu solicitud no llegó a ningún refugio real. Quedó guardada solo
            en este navegador para demostrar el flujo.
          </p>

          <div className="mt-6">
            <BackLink href={`/perfil/${pet.id}`}>Volver al perfil de {petName}</BackLink>
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-4">
      {generalErrors.length > 0 ? (
        <div
          role="alert"
          className="rounded-md border border-danger-rule bg-danger-soft p-4 text-sm text-danger"
        >
          <p className="font-semibold">No se pudo enviar la solicitud:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1">
            {generalErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Surface className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-adoption-soft text-adoption"
          >
            <HeartHandshake size={21} />
          </span>
          <div>
            <h2 className="font-display text-xl leading-snug text-ink">
              Solicitud de adopción de {petName}
            </h2>
            <p className="mt-1 text-sm text-ink-2">{viaText} · Prototipo, sin envío real</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            id="adopcion-nombre"
            label="Tu nombre completo"
            error={fieldErrors.nombre}
          >
            {(control) => (
              <input
                {...control}
                ref={nombreRef}
                name="nombre"
                type="text"
                autoComplete="name"
                value={values.nombre}
                onChange={(event) => handleChange("nombre", event.target.value)}
                placeholder="Ej: Ana López"
              />
            )}
          </Field>

          <Field
            id="adopcion-telefono"
            label="Teléfono (WhatsApp)"
            error={fieldErrors.telefono}
            help="10 dígitos o formato México (52/521)."
          >
            {(control) => (
              <input
                {...control}
                ref={telefonoRef}
                name="telefono"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                value={values.telefono}
                onChange={(event) => handleChange("telefono", event.target.value)}
                placeholder="10 dígitos"
              />
            )}
          </Field>

          <Field
            id="adopcion-email"
            label="Correo electrónico"
            optional
            error={fieldErrors.email}
          >
            {(control) => (
              <input
                {...control}
                ref={emailRef}
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="opcional@correo.mx"
              />
            )}
          </Field>

          <Field
            id="adopcion-motivo"
            label={`¿Por qué quieres adoptar a ${petName}?`}
            error={fieldErrors.motivo}
            className="sm:col-span-2"
          >
            {(control) => (
              <textarea
                {...control}
                ref={motivoRef}
                name="motivo"
                rows={3}
                value={values.motivo}
                onChange={(event) => handleChange("motivo", event.target.value)}
                placeholder="Cuéntanos sobre tu hogar y el cuidado que le ofrecerías."
                className={`${control.className} resize-none`}
              />
            )}
          </Field>

          <Field id="adopcion-notas" label="Notas adicionales" optional className="sm:col-span-2">
            {(control) => (
              <textarea
                {...control}
                name="notas"
                rows={2}
                value={values.notas}
                onChange={(event) => handleChange("notas", event.target.value)}
                placeholder="Ej: vivo en un departamento, tengo espacio para pasearla."
                className={`${control.className} resize-none`}
              />
            )}
          </Field>

          <div className="sm:col-span-2">
            <SubmitButton
              busy={phase === "sending"}
              busyLabel="Enviando…"
              icon={<Send size={17} aria-hidden="true" />}
            >
              Enviar solicitud
            </SubmitButton>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-rule-strong bg-sunken p-4">
          <p className="max-w-md text-xs leading-5 text-ink-2">
            Prototipo: la solicitud no se envía a ningún servidor. Queda registrada solo en este
            navegador.
            {requests.length > 0
              ? ` Solicitudes guardadas en este dispositivo: ${requests.length}.`
              : ""}
          </p>
          <BackLink href={`/perfil/${pet.id}`}>Cancelar y volver al perfil</BackLink>
        </div>
      </Surface>
    </div>
  );
}
