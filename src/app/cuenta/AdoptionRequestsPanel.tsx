"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";
import {
  reviewAdoptionRequest,
  type AccountAdoptionRequest,
  type AdoptionRequestReviewStatus,
} from "@/lib/account/adoptionRequests";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";

const STATUS_LABELS: Record<AccountAdoptionRequest["status"], string> = {
  enviada: "Enviada",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
  completada: "Completada",
};

const STATUS_TONES: Record<AccountAdoptionRequest["status"], string> = {
  enviada: "adoption",
  en_revision: "warning",
  aprobada: "success",
  rechazada: "danger",
  cancelada: "muted",
  completada: "brand",
};

function canCancel(request: AccountAdoptionRequest): boolean {
  return request.role === "applicant" && ["enviada", "en_revision", "aprobada"].includes(request.status);
}

function reviewActions(request: AccountAdoptionRequest): Array<{
  label: string;
  status: AdoptionRequestReviewStatus;
  variant: "primary" | "danger";
  icon: React.ReactNode;
}> {
  if (request.role !== "owner") return [];

  if (request.status === "enviada") {
    return [
      { label: "Pasar a revisión", status: "en_revision", variant: "primary", icon: <Eye size={15} /> },
      { label: "Rechazar", status: "rechazada", variant: "danger", icon: <X size={15} /> },
    ];
  }

  if (request.status === "en_revision") {
    return [
      { label: "Aprobar", status: "aprobada", variant: "primary", icon: <Check size={15} /> },
      { label: "Rechazar", status: "rechazada", variant: "danger", icon: <X size={15} /> },
    ];
  }

  if (request.status === "aprobada") {
    return [{ label: "Rechazar", status: "rechazada", variant: "danger", icon: <X size={15} /> }];
  }

  return [];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value));
}

export function AdoptionRequestsPanel({ requests }: { requests: AccountAdoptionRequest[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(requestId: string, status: AdoptionRequestReviewStatus) {
    if (busyId) return;

    setError(null);
    setBusyId(requestId);
    try {
      const supabase = createSupabaseBrowserClient();
      const result = await reviewAdoptionRequest(
        {
          rpc: async (functionName, params) => {
            const response = await supabase.rpc(functionName, params);
            return { data: response.data, error: response.error };
          },
        },
        requestId,
        status,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    } catch {
      setError("No pudimos actualizar la solicitud. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Surface as="section" size="lg" rest={{ "aria-labelledby": "solicitudes-adopcion-titulo" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-adoption">
            Seguimiento
          </p>
          <h2 id="solicitudes-adopcion-titulo" className="mt-1 font-display text-2xl text-ink">
            Solicitudes de adopción
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-2">
            Consulta las solicitudes que enviaste y las que recibiste para tus mascotas.
          </p>
        </div>
        <Pill tone="adoption" size="sm">
          {requests.length} {requests.length === 1 ? "solicitud" : "solicitudes"}
        </Pill>
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-md bg-danger-soft px-3.5 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {requests.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-rule-strong bg-sunken p-5 text-sm leading-6 text-ink-2">
          Todavía no hay solicitudes vinculadas con tu cuenta.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {requests.map((request) => {
            const actions = reviewActions(request);
            const isBusy = busyId === request.id;

            return (
              <article key={request.id} className="rounded-md border border-rule bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
                      {request.role === "applicant" ? "Solicitud enviada" : "Solicitud recibida"}
                    </p>
                    <h3 className="mt-1 truncate font-display text-xl text-ink">{request.pet.name}</h3>
                    <p className="mt-1 text-sm text-ink-2">{request.pet.publicCode}</p>
                  </div>
                  <Pill tone={STATUS_TONES[request.status]} size="sm">
                    {STATUS_LABELS[request.status]}
                  </Pill>
                </div>

                <dl className="mt-4 grid gap-2 border-t border-rule pt-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-3">Fecha</dt>
                    <dd className="font-medium text-ink">{formatDate(request.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">{request.role === "applicant" ? "Tu motivo" : "Motivo"}</dt>
                    <dd className="mt-1 leading-5 text-ink-2">{request.reason}</dd>
                  </div>
                  {request.role === "owner" ? (
                    <div>
                      <dt className="text-ink-3">Contacto</dt>
                      <dd className="mt-1 text-ink-2">
                        {request.name} · {request.phone}
                        {request.email ? ` · ${request.email}` : ""}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {actions.length > 0 || canCancel(request) ? (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-rule pt-4">
                    {actions.map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.variant}
                        disabled={isBusy}
                        onClick={() => void update(request.id, action.status)}
                        icon={action.icon}
                      >
                        {isBusy ? "Actualizando…" : action.label}
                      </Button>
                    ))}
                    {canCancel(request) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => void update(request.id, "cancelada")}
                        icon={<X size={15} />}
                      >
                        {isBusy ? "Cancelando…" : "Cancelar solicitud"}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </Surface>
  );
}
