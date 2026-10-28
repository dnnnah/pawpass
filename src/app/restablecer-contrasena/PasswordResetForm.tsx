"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import { validateNewPassword, type AuthErrors } from "@/lib/authValidation";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { safeAuthNextPath } from "@/lib/authRedirect";

type ResetState = "checking" | "ready" | "saving" | "success" | "invalid" | "unavailable";

export function PasswordResetForm({ nextPath, expired = false }: { nextPath: string; expired?: boolean }) {
  const router = useRouter();
  const configured = hasSupabaseEnv();
  const [state, setState] = useState<ResetState>(expired ? "invalid" : configured ? "checking" : "unavailable");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [message, setMessage] = useState<string | null>(expired
    ? "El enlace venció o ya se utilizó. Solicita uno nuevo para continuar."
    : configured ? null : "Falta configurar Supabase para validar este enlace. Contacta a quien administra PawPass.");

  useEffect(() => {
    if (expired) return;
    if (!configured) return;

    let active = true;
    void createSupabaseBrowserClient().auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setState("invalid");
        setMessage("El enlace venció, ya se utilizó o no está abierto en este navegador. Solicita uno nuevo para continuar.");
      } else {
        setState("ready");
      }
    }).catch(() => {
      if (!active) return;
      setState("invalid");
      setMessage("No pudimos validar el enlace. Comprueba tu conexión o solicita uno nuevo.");
    });

    return () => { active = false; };
  }, [configured, expired]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateNewPassword(password, confirmPassword);
    setErrors(nextErrors);
    setMessage(null);
    if (Object.keys(nextErrors).length > 0) return;
    if (!hasSupabaseEnv()) {
      setState("unavailable");
      setMessage("Falta configurar Supabase para cambiar la contraseña.");
      return;
    }

    setState("saving");
    try {
      const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (error) throw error;
      setState("success");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setState("ready");
      setMessage("No pudimos actualizar la contraseña. El enlace puede haber vencido o el servicio puede estar temporalmente ocupado. Solicita otro enlace e inténtalo de nuevo.");
    }
  }

  return <Surface as="section" className="p-5 sm:p-7" rest={{ "aria-labelledby": "restablecer-titulo" }}>
    <h2 id="restablecer-titulo" className="font-display text-2xl text-ink">Nueva contraseña</h2>
    <p className="mt-2 text-sm leading-6 text-ink-2">Elige una contraseña de al menos 8 caracteres para recuperar tu cuenta.</p>

    {state === "checking" ? <p role="status" className="mt-5 text-sm text-ink-2">Validando el enlace…</p> : null}
    {state === "success" ? <div className="mt-5 grid gap-4">
      <p role="status" className="rounded-md bg-success-soft px-3.5 py-3 text-sm leading-6 text-success">Tu contraseña se actualizó. Ya puedes continuar con tu cuenta.</p>
      <button type="button" onClick={() => { router.replace(safeAuthNextPath(nextPath)); router.refresh(); }} className="min-h-11 rounded-md bg-brand px-4 font-semibold text-on-solid hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Continuar</button>
    </div> : null}
    {message ? <p role={state === "unavailable" || state === "invalid" ? "alert" : "status"} className={`mt-5 rounded-md px-3.5 py-3 text-sm leading-6 ${state === "unavailable" || state === "invalid" ? "bg-danger-soft text-danger" : "bg-sunken text-ink-2"}`}>{message}</p> : null}
    {state === "ready" || state === "saving" ? <form className="mt-5 grid gap-4" onSubmit={(event) => void submit(event)} noValidate>
      <Field id="new-password" label="Nueva contraseña" error={errors.password} help="Usa al menos 8 caracteres.">
        {(field) => <input {...field} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />}
      </Field>
      <Field id="confirm-new-password" label="Repite la contraseña" error={errors.confirmPassword}>
        {(field) => <input {...field} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />}
      </Field>
      <SubmitButton busy={state === "saving"} busyLabel="Guardando…" icon={<KeyRound size={16} />}>Guardar nueva contraseña</SubmitButton>
    </form> : null}
    {state === "invalid" ? <a href="/login" className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">Volver al acceso y solicitar otro enlace</a> : null}
    {state === "unavailable" ? <a href="/login" className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">Volver al acceso</a> : null}
  </Surface>;
}
