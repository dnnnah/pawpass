"use client";

import { useRef, useState } from "react";
import { HeartHandshake, Send } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import { validatePublicAdoptionRequest } from "@/lib/adoption/publicRequest";
import { trackAdoptionRequestStarted } from "@/lib/services/telemetry/trackers";
import { useTelemetryOnMount } from "@/components/telemetry/use-telemetry-on-mount";

type AdoptionRequestFormProps = {
  petId: string;
  petName: string;
  shelterName?: string | null;
};

type FormValues = { name: string; phone: string; email: string; reason: string; website: string };
const EMPTY_FORM_VALUES = Object.fromEntries(["name", "phone", "email", "reason", "website"].map((key) => [key, ""])) as FormValues;

function createIdempotencyKey(): string {
  if (typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function AdoptionRequestForm({ petId, petName, shelterName = null }: AdoptionRequestFormProps) {
  useTelemetryOnMount(() => trackAdoptionRequestStarted("form"));

  const [values, setValues] = useState<FormValues>(EMPTY_FORM_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"form" | "sending" | "success">("form");
  const [deliveryError, setDeliveryError] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  function change(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => { const next = { ...current }; delete next[field]; return next; });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "sending") return;
    const validation = validatePublicAdoptionRequest({ petId, ...values });
    if (!validation.valid) {
      if ("blocked" in validation) { setPhase("success"); return; }
      setErrors(validation.errors);
      setDeliveryError(false);
      const first = validation.errors.name ? nameRef.current : validation.errors.phone ? phoneRef.current : reasonRef.current;
      first?.focus();
      return;
    }

    setErrors({});
    setDeliveryError(false);
    setPhase("sending");
    idempotencyKey.current ??= createIdempotencyKey();
    try {
      const response = await fetch("/api/adopciones", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey.current },
        body: JSON.stringify(validation.value),
      });
      if (!response.ok) throw new Error("delivery_failed");
      setPhase("success");
    } catch {
      setDeliveryError(true);
      setPhase("form");
    }
  }

  if (phase === "success") {
    return (
      <Surface className="p-6 sm:p-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-adoption">Adopción</p>
          <h2 className="mt-2 font-display text-2xl leading-snug text-ink sm:text-3xl">Solicitud entregada</h2>
          <p className="mt-2.5 text-sm leading-6 text-ink-2">
            Gracias por tu interés en {petName}. Compartimos tu mensaje con {shelterName ? `el refugio ${shelterName}` : "la persona responsable"}; el seguimiento continúa directamente con ellos fuera de PawPass.
          </p>
          <p className="mt-4 text-xs leading-5 text-ink-3">Esto confirma la entrega del mensaje, no la aceptación ni la finalización de una adopción.</p>
          <div className="mt-6"><BackLink href={`/adopciones/${petId}`}>Volver a la ficha de {petName}</BackLink></div>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-4">
      {deliveryError ? <p role="alert" className="rounded-md border border-danger-rule bg-danger-soft p-4 text-sm text-danger">No pudimos entregar tu solicitud. Revisa tu conexión e intenta de nuevo.</p> : null}
      <Surface className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-adoption-soft text-adoption"><HeartHandshake size={21} /></span>
          <div>
            <h2 className="font-display text-xl leading-snug text-ink">Escribe a la persona responsable</h2>
            <p className="mt-1 text-sm text-ink-2">No necesitas una cuenta · {shelterName ? `Refugio ${shelterName}` : "Adopción directa"}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field id="adopcion-nombre" label="Tu nombre completo" error={errors.name}>
            {(control) => <input {...control} ref={nameRef} autoComplete="name" value={values.name} onChange={(e) => change("name", e.target.value)} placeholder="Ej: Ana López" />}
          </Field>
          <Field id="adopcion-telefono" label="Teléfono (WhatsApp)" error={errors.phone} help="Incluye lada, entre 10 y 15 dígitos.">
            {(control) => <input {...control} ref={phoneRef} type="tel" autoComplete="tel" value={values.phone} onChange={(e) => change("phone", e.target.value)} placeholder="10 dígitos" />}
          </Field>
          <Field id="adopcion-email" label="Correo electrónico" optional error={errors.email}>
            {(control) => <input {...control} type="email" autoComplete="email" value={values.email} onChange={(e) => change("email", e.target.value)} placeholder="opcional@correo.mx" />}
          </Field>
          <Field id="adopcion-motivo" label={`¿Por qué te interesa ${petName}?`} error={errors.reason} className="sm:col-span-2">
            {(control) => <textarea {...control} ref={reasonRef} rows={4} value={values.reason} onChange={(e) => change("reason", e.target.value)} placeholder="Cuéntanos brevemente sobre el hogar y cuidado que le ofrecerías." className={`${control.className} resize-none`} />}
          </Field>
          <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
            <label htmlFor="adopcion-sitio">Deja vacío</label>
            <input id="adopcion-sitio" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => change("website", e.target.value)} />
          </div>
          <div className="sm:col-span-2"><SubmitButton busy={phase === "sending"} busyLabel="Entregando…" icon={<Send size={17} aria-hidden="true" />}>Enviar solicitud</SubmitButton></div>
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-rule-strong bg-sunken p-4">
          <p className="max-w-md text-xs leading-5 text-ink-2">Tu nombre, teléfono y mensaje se entregan por correo al responsable. La conversación continúa fuera de PawPass y no se crea una cuenta ni historial en la plataforma.</p>
          <BackLink href={`/adopciones/${petId}`}>Cancelar y volver</BackLink>
        </div>
      </Surface>
    </div>
  );
}
