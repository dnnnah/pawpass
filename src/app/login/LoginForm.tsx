"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, Eye, EyeOff, Globe2, LogIn, UserPlus } from "lucide-react";
import { Field, SubmitButton } from "@/components/ui/Field";
import { Surface } from "@/components/ui/Surface";
import { validateAuthInput, type AuthErrors, type AuthMode } from "@/lib/authValidation";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { replacePasswordOnPaste } from "@/lib/authPasswordInput";
import { safeAuthNextPath } from "@/lib/authRedirect";
import { getEnabledOAuthProviders, type EnabledOAuthProviders, type OAuthProvider } from "@/lib/infra/supabase/authProviders";

async function ensureProfile(supabase: ReturnType<typeof createSupabaseBrowserClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
}

function getNextPath(): string {
  if (typeof window === "undefined") return "/mis-mascotas";

  const value = new URLSearchParams(window.location.search).get("next");
  return safeAuthNextPath(value);
}

export function LoginForm({ oauthProviders, initialError = null }: { oauthProviders: EnabledOAuthProviders; initialError?: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [serverError, setServerError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationEmailPending, setConfirmationEmailPending] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null);

  const isSignup = mode === "signup";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrors({});
    setServerError(null);
    setNotice(null);
    setConfirmationEmailPending(false);
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
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNextPath())}`,
          },
        });
        if (error) throw error;

        if (data.session) {
          await ensureProfile(supabase);
          router.replace(getNextPath());
          router.refresh();
        } else {
          setConfirmationEmailPending(true);
          setNotice("Si este correo aún no tiene cuenta, recibirás un enlace para confirmarla. Si ya te registraste, inicia sesión con tu contraseña.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await ensureProfile(supabase);
        router.replace(getNextPath());
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos completar el acceso.";
      if (!isSignup && /email.*not confirmed|not confirmed/i.test(message)) {
        setConfirmationEmailPending(true);
        setNotice("Tu correo todavía no está confirmado. Puedes reenviar el enlace de confirmación.");
      } else if (/invalid login credentials/i.test(message)) {
        setServerError("El correo o la contraseña no coinciden. Volver a registrar una cuenta existente no cambia su contraseña.");
      } else {
        setServerError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResendConfirmation() {
    setServerError(null);
    setResendingConfirmation(true);

    try {
      const { error } = await createSupabaseBrowserClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNextPath())}`,
        },
      });
      if (error) throw error;

      setConfirmationEmailPending(false);
      setNotice("Si hay una cuenta pendiente de confirmar con este correo, se ha solicitado otro enlace. Las cuentas ya confirmadas pueden iniciar sesión directamente.");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "No pudimos reenviar el correo de confirmación.");
    } finally {
      setResendingConfirmation(false);
    }
  }

  async function handleOAuth(provider: OAuthProvider) {
    setServerError(null);
    setNotice(null);

    if (!hasSupabaseEnv()) {
      setServerError("La cuenta todavía no está conectada. Configura Supabase para habilitar el acceso.");
      return;
    }

    setOauthProvider(provider);
    try {
      const available = await getEnabledOAuthProviders();
      if (!available[provider]) {
        throw new Error(`El acceso con ${provider === "google" ? "Google" : "Apple"} todavía no está disponible. Usa tu correo y contraseña.`);
      }

      const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNextPath())}`,
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
        <div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { id: "google" as const, label: "Google", icon: Globe2 },
              { id: "apple" as const, label: "Apple", icon: Apple },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => void handleOAuth(id)}
                disabled={!oauthProviders[id] || busy || oauthProvider !== null}
                aria-describedby={!oauthProviders[id] ? "acceso-social-disponibilidad" : undefined}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-ink disabled:pointer-events-none disabled:opacity-50"
              >
                <Icon size={17} aria-hidden="true" />
                <span>
                  {oauthProvider === id ? "Conectando…" : `Continuar con ${label}`}
                  {!oauthProviders[id] ? <span className="block text-xs font-normal">No disponible</span> : null}
                </span>
              </button>
            ))}
          </div>
          {!oauthProviders.google || !oauthProviders.apple ? (
            <p id="acceso-social-disponibilidad" className="mt-2 text-xs leading-5 text-ink-2">
              Puedes usar tu correo y contraseña mientras se habilitan los accesos sociales pendientes.
            </p>
          ) : null}
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
            <div className="relative">
              <input
                {...field}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onPaste={(event) => replacePasswordOnPaste(event, setPassword)}
                className={`${field.className} pr-12`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-controls="password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 inline-flex min-h-11 w-11 items-center justify-center rounded-r-md text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          )}
        </Field>

        {isSignup ? (
          <Field id="confirm-password" label="Repite la contraseña" error={errors.confirmPassword}>
            {(field) => (
              <div className="relative">
                <input
                  {...field}
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="off"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onPaste={(event) => replacePasswordOnPaste(event, setConfirmPassword)}
                  className={`${field.className} pr-12`}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-controls="confirm-password"
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 inline-flex min-h-11 w-11 items-center justify-center rounded-r-md text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            )}
          </Field>
        ) : null}

        {serverError ? (
          <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-3 text-sm leading-6 text-danger">
            {serverError}
          </p>
        ) : null}
        {notice ? (
          <div role="status" className="rounded-md bg-success-soft px-3.5 py-3 text-sm leading-6 text-success">
            <p>{notice}</p>
            {isSignup ? (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="mt-2 block min-h-9 rounded-sm font-semibold underline underline-offset-2"
              >
                Ya tengo cuenta: iniciar sesión
              </button>
            ) : null}
            {confirmationEmailPending ? (
              <button
                type="button"
                onClick={() => void handleResendConfirmation()}
                disabled={resendingConfirmation}
                className="mt-2 min-h-9 rounded-sm font-semibold underline decoration-current/50 underline-offset-2 hover:decoration-current disabled:opacity-60"
              >
                {resendingConfirmation ? "Reenviando…" : "Reenviar correo de confirmación"}
              </button>
            ) : null}
          </div>
        ) : null}

        <SubmitButton busy={busy} busyLabel={isSignup ? "Creando cuenta…" : "Entrando…"} icon={isSignup ? <UserPlus size={17} /> : <LogIn size={17} />}>
          {isSignup ? "Crear cuenta" : "Iniciar sesión"}
        </SubmitButton>
      </form>
    </Surface>
  );
}
