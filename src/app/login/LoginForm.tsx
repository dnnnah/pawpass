"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, ArrowRight, Globe2, LogIn, UserPlus } from "lucide-react";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import { validateAuthInput, type AuthErrors, type AuthMode } from "@/lib/authValidation";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

async function ensureProfile(supabase: ReturnType<typeof createSupabaseBrowserClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
}

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "apple" | null>(null);

  const isSignup = mode === "signup";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrors({});
    setServerError(null);
    setNotice(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setNotice(null);

    const nextErrors = validateAuthInput({ mode, email, password, confirmPassword });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!hasSupabaseEnv()) {
      setServerError("La cuenta todavía no está conectada. Configura Supabase para habilitar el acceso.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/cuenta`,
          },
        });
        if (error) throw error;

        if (data.session) {
          await ensureProfile(supabase);
          router.replace("/cuenta");
          router.refresh();
        } else {
          setNotice("Revisa tu correo para confirmar la cuenta antes de iniciar sesión.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await ensureProfile(supabase);
        router.replace("/cuenta");
        router.refresh();
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "No pudimos completar el acceso.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setServerError(null);
    setNotice(null);

    if (!hasSupabaseEnv()) {
      setServerError("La cuenta todavía no está conectada. Configura Supabase para habilitar el acceso.");
      return;
    }

    setOauthProvider(provider);
    try {
      const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/cuenta`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setOauthProvider(null);
      setServerError(error instanceof Error ? error.message : "No pudimos iniciar el acceso social.");
    }
  }

  return (
    <Surface as="section" className="p-5 sm:p-7" rest={{ "aria-labelledby": "cuenta-titulo" }}>
      <div className="flex flex-wrap gap-2 border-b border-rule pb-4" role="tablist" aria-label="Tipo de acceso">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => switchMode("login")}
          className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${mode === "login" ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-sunken"}`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => switchMode("signup")}
          className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${mode === "signup" ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-sunken"}`}
        >
          Crear cuenta
        </button>
      </div>

      <div className="mt-6">
        <h2 id="cuenta-titulo" className="font-display text-2xl text-ink">
          {isSignup ? "Crea tu cuenta de tutor" : "Accede a tu cuenta"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-2">
          {isSignup
            ? "Después podrás asociar mascotas, actualizar su ficha y controlar qué información se comparte."
            : "Administra tus mascotas y sus datos públicos desde un solo lugar."}
        </p>
      </div>

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void handleOAuth("google")}
            disabled={busy || oauthProvider !== null}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-ink disabled:pointer-events-none disabled:opacity-50"
          >
            <Globe2 size={17} aria-hidden="true" />
            {oauthProvider === "google" ? "Conectando…" : "Continuar con Google"}
          </button>
          <button
            type="button"
            onClick={() => void handleOAuth("apple")}
            disabled={busy || oauthProvider !== null}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-ink disabled:pointer-events-none disabled:opacity-50"
          >
            <Apple size={17} aria-hidden="true" />
            {oauthProvider === "apple" ? "Conectando…" : "Continuar con Apple"}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-3" aria-hidden="true">
          <span className="h-px flex-1 bg-rule" />
          <span>o usa tu correo</span>
          <span className="h-px flex-1 bg-rule" />
        </div>

        <Field id="email" label="Correo electrónico" error={errors.email}>
          {(field) => (
            <input
              {...field}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
            />
          )}
        </Field>

        <Field
          id="password"
          label="Contraseña"
          error={errors.password}
          help={isSignup ? "Usa al menos 8 caracteres." : undefined}
        >
          {(field) => (
            <input
              {...field}
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          )}
        </Field>

        {isSignup ? (
          <Field id="confirm-password" label="Repite la contraseña" error={errors.confirmPassword}>
            {(field) => (
              <input
                {...field}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
              />
            )}
          </Field>
        ) : null}

        {serverError ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-3 text-sm leading-6 text-danger">
            {serverError}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="rounded-md bg-success-soft px-3.5 py-3 text-sm leading-6 text-success">
            {notice}
          </p>
        ) : null}

        <SubmitButton busy={busy} busyLabel={isSignup ? "Creando cuenta…" : "Entrando…"} icon={isSignup ? <UserPlus size={17} /> : <LogIn size={17} />}>
          {isSignup ? "Crear cuenta" : "Iniciar sesión"}
        </SubmitButton>
      </form>

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-ink-3">
        <ArrowRight size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        Las fichas públicas y sus QR siguen disponibles sin iniciar sesión.
      </p>
    </Surface>
  );
}
