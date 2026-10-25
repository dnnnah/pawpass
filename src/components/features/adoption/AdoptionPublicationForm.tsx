"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";
import { setPetAdoptionPublication } from "@/lib/account/adoptionPublication";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import type { PetStatus } from "@/types/pet";

type AdoptionPublicationFormProps = {
  petId: string;
  petName: string;
  status: PetStatus;
  canEdit: boolean;
  shelterId?: string;
  actorLabel?: string;
};

export function AdoptionPublicationForm({
  petId,
  petName,
  status,
  canEdit,
  shelterId,
  actorLabel = "tu cuenta",
}: AdoptionPublicationFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const published = status === "en_adopcion";
  const eligible = status === "en_casa" || published;

  async function updatePublication() {
    if (busy || !canEdit || !eligible) return;
    if (!hasSupabaseEnv()) {
      setError("La publicación necesita conexión con PawPass. Intenta de nuevo más tarde.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await setPetAdoptionPublication(
      {
        rpc: async (functionName, params) => {
          const response = await createSupabaseBrowserClient().rpc(functionName, params);
          return { error: response.error };
        },
      },
      petId,
      !published,
      shelterId,
    );
    if (result) {
      setError(result);
    } else {
      setNotice(published ? "La publicación se retiró del catálogo." : "La mascota ya aparece en el catálogo de adopción.");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="mt-4 border-t border-rule pt-4">
      {!canEdit ? (
        <p className="flex items-start gap-2 text-xs leading-5 text-ink-3">
          <LockKeyhole size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Solo una persona administradora puede publicar a {petName}.
        </p>
      ) : !eligible ? (
        <p className="text-xs leading-5 text-ink-3">
          {status === "perdido"
            ? "Retira la alerta de pérdida antes de publicar en adopción."
            : "Este estado no permite publicar en adopción."}
        </p>
      ) : (
        <Surface variant="sunken" size="sm" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 font-semibold text-ink">
              <HeartHandshake size={16} className="text-adoption" aria-hidden="true" />
              Publicación de adopción
            </h4>
            {published ? <Pill tone="adoption" size="sm">En catálogo</Pill> : null}
          </div>
          <p className="text-xs leading-5 text-ink-2">
            {published
              ? `La mascota aparece públicamente y las solicitudes se entregan al correo responsable de ${actorLabel}.`
              : `Al publicar, cualquier visitante verá el nombre, especie, zona aproximada y foto principal de ${petName}. Las solicitudes se enviarán al correo responsable de ${actorLabel}.`}
          </p>
          <p className="text-xs leading-5 text-ink-3">
            El carnet, el QR, la salud, los documentos y los teléfonos o correos privados no se muestran en el catálogo.
          </p>
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          {notice ? <p role="status" className="text-sm text-success">{notice}</p> : null}
          <Button
            type="button"
            variant={published ? "secondary" : "primary"}
            size="sm"
            disabled={busy}
            onClick={() => void updatePublication()}
          >
            {busy ? "Guardando…" : published ? "Retirar del catálogo" : "Publicar en adopción"}
          </Button>
        </Surface>
      )}
    </div>
  );
}
