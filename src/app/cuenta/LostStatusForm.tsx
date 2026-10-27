"use client";

import { useState } from "react";
import { AlertTriangle, BellRing, Download, LockKeyhole, SearchCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";
import {
  changePetStatus,
  validateLostAlertInput,
  type LostAlertErrors,
  type LostAlertInput,
} from "@/lib/account/petStatus";
import type { PetStatus } from "@/types/pet";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

type LostStatusFormProps = {
  petId: string;
  petName: string;
  status: PetStatus;
  canEdit: boolean;
};

const initialInput = (): LostAlertInput => ({
  zone: "",
  date: new Date().toISOString().slice(0, 10),
  message: "",
  reward: "",
});

export function LostStatusForm({ petId, petName, status, canEdit }: LostStatusFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<LostAlertInput>(initialInput);
  const [errors, setErrors] = useState<LostAlertErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isLost = status === "perdido";

  function updateField(field: keyof LostAlertInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
    setNotice(null);
  }

  async function submitStatus(nextStatus: "perdido" | "en_casa", event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!canEdit) return;

    if (nextStatus === "perdido") {
      const nextErrors = validateLostAlertInput(input);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }

    if (!hasSupabaseEnv()) {
      setError("El estado de la mascota necesita Supabase.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await changePetStatus(
      {
        rpc: async (functionName, params) => {
          const response = await createSupabaseBrowserClient().rpc(functionName, params);
          return { data: response.data, error: response.error };
        },
      },
      petId,
      { ...input, status: nextStatus },
    );

    if (result) {
      setError(result);
    } else {
      setNotice(nextStatus === "perdido" ? "Alerta activada en la ficha pública." : "Mascota marcada como en casa.");
      setOpen(false);
      router.refresh();
    }
    setBusy(false);
  }

  if (!canEdit) {
    return (
      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-3">
        <LockKeyhole size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        Solo la persona administradora puede cambiar el estado de {petName}.
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-rule pt-4">
      {isLost ? (
        <Surface as="section" variant="accent" tone="danger" size="sm" className="mt-4" rest={{ role: "alert", "aria-labelledby": `${petId}-alerta-urgente` }}>
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-danger text-white"><AlertTriangle size={21} /></span>
            <h4 id={`${petId}-alerta-urgente`} className="min-w-0 flex-1 font-display text-xl font-bold text-danger [overflow-wrap:anywhere]">URGENTE: {petName} está perdida</h4>
          </div>
          <p className="mt-3 text-sm leading-5 text-ink">Difunde la alerta para ayudar a que vuelva a casa. Descarga su imagen y compártela.</p>
          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2">
            <Button href={`/cuenta/mascotas/${encodeURIComponent(petId)}/alerta`} size="sm" variant="danger" icon={<Download size={15} />}>Generar imagen para compartir</Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => void submitStatus("en_casa")}
              icon={<SearchCheck size={15} />}
            >
              Marcar como encontrada
            </Button>
          </div>
          <Pill tone="danger" size="sm" icon={<BellRing size={13} />} className="mt-3">Alerta pública activa</Pill>
        </Surface>
      ) : (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setOpen((value) => !value);
              setError(null);
              setNotice(null);
            }}
            icon={<BellRing size={15} />}
          >
            {open ? "Ocultar alerta" : "Reportar como perdida"}
          </Button>

          {open ? (
            <Surface as="section" variant="sunken" size="sm" className="mt-4" rest={{ "aria-labelledby": `${petId}-alerta-titulo` }}>
              <h4 id={`${petId}-alerta-titulo`} className="font-semibold text-ink">Alerta de {petName}</h4>
              <p className="mt-1 text-xs leading-5 text-ink-2">
                Esta información aparecerá en la ficha pública y permitirá que quien la encuentre contacte a su familia.
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-2">Antes de activarla, revisa que el QR tenga un canal de contacto elegido y que la foto esté cargada.</p>
              <Button href={`/cuenta/mascotas/${petId}`} variant="quiet" size="sm" className="mt-2">Revisar carnet y contacto</Button>
              <form className="mt-4 grid gap-3" onSubmit={(event) => void submitStatus("perdido", event)} noValidate>
                <Field id={`${petId}-lost-zone`} label="Zona donde se perdió" error={errors.zone}>
                  {(field) => (
                    <input
                      {...field}
                      type="text"
                      maxLength={200}
                      value={input.zone}
                      onChange={(event) => updateField("zone", event.target.value)}
                      placeholder="Ej. Parque México"
                    />
                  )}
                </Field>
                <Field id={`${petId}-lost-date`} label="Fecha de pérdida" error={errors.date}>
                  {(field) => (
                    <input
                      {...field}
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={input.date}
                      onChange={(event) => updateField("date", event.target.value)}
                    />
                  )}
                </Field>
                <Field id={`${petId}-lost-reward`} label="Recompensa (MXN)" optional error={errors.reward}>
                  {(field) => (
                    <input
                      {...field}
                      type="number"
                      min="0"
                      step="1"
                      value={input.reward}
                      onChange={(event) => updateField("reward", event.target.value)}
                      placeholder="Opcional"
                    />
                  )}
                </Field>
                <Field id={`${petId}-lost-message`} label="Mensaje" optional error={errors.message}>
                  {(field) => (
                    <textarea
                      {...field}
                      rows={3}
                      maxLength={2000}
                      value={input.message}
                      onChange={(event) => updateField("message", event.target.value)}
                      placeholder="Ej. Se perdió cerca del parque."
                      className={`${field.className} resize-none`}
                    />
                  )}
                </Field>

                {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
                {notice ? <p className="text-sm text-success" role="status">{notice}</p> : null}
                <SubmitButton busy={busy} busyLabel="Activando…" icon={<BellRing size={16} />}>
                  Activar alerta
                </SubmitButton>
              </form>
            </Surface>
          ) : null}
        </>
      )}

      {error && !open ? <p className="mt-2 text-sm text-danger" role="alert">{error}</p> : null}
      {notice && !open ? <p className="mt-2 text-sm text-success" role="status">{notice}</p> : null}
    </div>
  );
}
