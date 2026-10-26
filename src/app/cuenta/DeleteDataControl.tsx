"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

type Props = { petId?: string; petName?: string; petsCount?: number | null };

export function DeleteDataControl({ petId, petName, petsCount = 0 }: Props) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [deleteLinkedPetsForever, setDeleteLinkedPetsForever] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = !petId;
  const blocked = account && (petsCount === null || petsCount === undefined);
  const label = account ? "Eliminar mi cuenta" : `Eliminar a ${petName}`;
  const confirmationPhrase = account ? "ELIMINAR MI CUENTA" : "ELIMINAR";
  const linkedPetsCopy = petsCount === 0 ? "todas las mascotas vinculadas que tengas"
    : petsCount === 1 ? "la mascota vinculada" : Number.isInteger(petsCount) ? `las ${petsCount} mascotas vinculadas` : "todas las mascotas vinculadas";

  async function remove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || blocked || confirmation !== confirmationPhrase || (account && !deleteLinkedPetsForever)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(account ? "/api/cuenta" : `/api/mascotas/${encodeURIComponent(petId!)}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation, deleteLinkedPetsForever: account && deleteLinkedPetsForever }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        setError(typeof result?.error === "string" ? result.error : "No pudimos completar la eliminación. Intenta de nuevo.");
        setBusy(false);
        return;
      }
      router.replace(account ? "/login" : "/mis-mascotas");
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
        ? `Se eliminarán tu perfil y tu acceso a PawPass. También se borrará para siempre ${linkedPetsCopy}, con sus carnets, fotos, documentos y registros; las demás personas tutoras perderán el acceso. Nadie podrá recuperarlos. Esta acción no se puede deshacer.`
        : `Se eliminarán de forma permanente el carnet, las fotos, los documentos y las publicaciones de ${petName}, también para otros tutores. Esta acción no se puede deshacer.`}</p>
      {blocked ? <div className="mt-3 grid gap-2 text-sm font-semibold text-danger">
        <p>No pudimos comprobar las mascotas asociadas. Por seguridad, la eliminación sigue bloqueada.</p>
        <Button href="/cuenta" variant="secondary" size="sm" className="w-fit">Volver a comprobar</Button>
      </div> : <form className="mt-4 grid gap-3" onSubmit={(event) => void remove(event)}>
        {account ? <label className="flex items-start gap-3 rounded-md border border-danger-rule bg-surface px-3 py-3 text-sm leading-5 text-ink">
          <input type="checkbox" checked={deleteLinkedPetsForever} onChange={(event) => setDeleteLinkedPetsForever(event.target.checked)} disabled={busy} className="mt-0.5 size-4 shrink-0 accent-danger" />
          <span><strong>Confirmación 1 de 2.</strong> Entiendo que se borrarán para siempre todas las mascotas vinculadas a esta cuenta, incluso sus carnets, fotos y documentos, y que las demás personas tutoras perderán el acceso.</span>
        </label> : null}
        <Field id={`confirm-delete-${petId ?? "account"}`} label={account ? "Confirmación 2 de 2: escribe ELIMINAR MI CUENTA" : "Escribe ELIMINAR para confirmar"}>
          {(field) => <input {...field} autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} />}
        </Field>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" variant="danger" disabled={busy || confirmation !== confirmationPhrase || (account && !deleteLinkedPetsForever)} icon={<Trash2 size={16} />}>{busy ? "Eliminando…" : label}</Button>
      </form>}
    </div>
  </details>;
}
