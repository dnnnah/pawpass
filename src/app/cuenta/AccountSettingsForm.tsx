"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";

type Props = { fullName: string; email: string; userId: string };

export function AccountSettingsForm({ fullName, email, userId }: Props) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [nextEmail, setNextEmail] = useState(email);
  const [saving, setSaving] = useState<"name" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function saveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 120) {
      setError("Escribe un nombre de entre 1 y 120 caracteres.");
      return;
    }
    setSaving("name"); setError(null); setNotice(null);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: normalizedName } });
    if (authError) {
      setError("No pudimos actualizar tu nombre. Revisa tu conexión e intenta de nuevo.");
      setSaving(null);
      return;
    }
    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: userId, full_name: normalizedName }, { onConflict: "id" },
    );
    setName(normalizedName);
    setNotice(profileError
      ? "El nombre de acceso se actualizó, pero no pudimos sincronizar el perfil. Intenta guardar de nuevo."
      : "Nombre guardado.");
    setSaving(null);
    router.refresh();
  }

  async function updateEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = nextEmail.trim();
    if (!normalizedEmail || normalizedEmail === email) {
      setError(normalizedEmail === email ? "Ese ya es tu correo actual." : "Escribe un correo válido.");
      return;
    }
    setSaving("email"); setError(null); setNotice(null);
    const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ email: normalizedEmail });
    if (updateError) {
      setError("No pudimos solicitar el cambio de correo. Revisa la dirección e intenta de nuevo.");
      setSaving(null);
      return;
    }
    setNotice("Solicitud enviada. Confirma el cambio desde el correo indicado; tu acceso conservará la dirección actual hasta confirmarlo.");
    setSaving(null);
  }

  return <div className="grid gap-6">
    <Surface as="section" size="lg" rest={{ "aria-labelledby": "datos-personales-titulo" }}>
      <h2 id="datos-personales-titulo" className="font-display text-2xl text-ink">Datos personales</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">El nombre y correo que usas para entrar a PawPass. Los teléfonos y correos de contacto para rescate se configuran en cada carnet.</p>
      <form className="mt-5 grid max-w-2xl gap-4" onSubmit={(event) => void saveName(event)}>
        <Field id="cuenta-nombre" label="Nombre completo">
          {(field) => <input {...field} autoComplete="name" maxLength={120} value={name} disabled={saving !== null} onChange={(event) => setName(event.target.value)} />}
        </Field>
        <SubmitButton busy={saving === "name"} busyLabel="Guardando…" icon={<Save size={16} />}>Guardar nombre</SubmitButton>
      </form>
    </Surface>

    <Surface as="section" size="lg" rest={{ "aria-labelledby": "correo-acceso-titulo" }}>
      <h2 id="correo-acceso-titulo" className="font-display text-2xl text-ink">Correo de acceso</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">Supabase puede pedir confirmación en tu correo actual y en el nuevo antes de completar el cambio.</p>
      <form className="mt-5 grid max-w-2xl gap-4" onSubmit={(event) => void updateEmail(event)}>
        <Field id="cuenta-correo" label="Correo electrónico">
          {(field) => <input {...field} type="email" autoComplete="email" maxLength={254} value={nextEmail} disabled={saving !== null} onChange={(event) => setNextEmail(event.target.value)} />}
        </Field>
        <SubmitButton busy={saving === "email"} busyLabel="Enviando solicitud…" icon={<Save size={16} />}>Actualizar correo de acceso</SubmitButton>
      </form>
    </Surface>

    {error ? <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm leading-6 text-danger">{error}</p> : null}
    {notice ? <p role="status" className="rounded-md bg-success-soft px-4 py-3 text-sm leading-6 text-success">{notice}</p> : null}
  </div>;
}
