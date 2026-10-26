"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";

type Props = { petId?: string; petName?: string; petsCount?: number };

export function DeleteDataControl({ petId, petName, petsCount = 0 }: Props) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = !petId;
  const blocked = account && petsCount > 0;
  const label = account ? "Eliminar mi cuenta" : `Eliminar a ${petName}`;

  async function remove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || blocked || confirmation !== "ELIMINAR") return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(account ? "/api/cuenta" : `/api/mascotas/${encodeURIComponent(petId!)}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        setError(typeof result?.error === "string" ? result.error : "No pudimos completar la eliminación. Intenta de nuevo.");
        setBusy(false);
        return;
      }
      if (account) await createSupabaseBrowserClient().auth.signOut({ scope: "local" });
      router.replace(account ? "/login" : "/cuenta");
      router.refresh();
    } catch {
      setError("No pudimos completar la eliminación. Revisa tu conexión e intenta de nuevo.");
      setBusy(false);
    }
  }

  return <details className="mt-5 border-t border-rule pt-4">
    <summary className="w-fit cursor-pointer rounded-sm text-sm font-semibold text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">{label}</summary>
    <div className="mt-3 rounded-lg border border-danger-rule bg-danger-soft p-4">
      <p className="text-sm leading-6 text-ink">{account
        ? "Se eliminarán tu perfil y tu acceso a PawPass. Para conservar el control de tus datos, elimina primero las mascotas asociadas. Esta acción no se puede deshacer."
        : `Se eliminarán de forma permanente el carnet, las fotos, los documentos y las publicaciones de ${petName}, también para otros tutores. Esta acción no se puede deshacer.`}</p>
      {blocked ? <p className="mt-3 text-sm font-semibold text-danger">Primero elimina las {petsCount} mascotas asociadas a tu cuenta.</p> : <form className="mt-4 grid gap-3" onSubmit={(event) => void remove(event)}>
        <Field id={`confirm-delete-${petId ?? "account"}`} label="Escribe ELIMINAR para confirmar">
          {(field) => <input {...field} autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} />}
        </Field>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" variant="danger" disabled={busy || confirmation !== "ELIMINAR"} icon={<Trash2 size={16} />}>{busy ? "Eliminando…" : label}</Button>
      </form>}
    </div>
  </details>;
}
