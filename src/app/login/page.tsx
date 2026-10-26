import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { LoginForm } from "./LoginForm";
import { getEnabledOAuthProviders } from "@/lib/infra/supabase/authProviders";

export const metadata: Metadata = {
  title: "Iniciar sesión | PawPass",
  description: "Acceso al panel de PawPass.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const oauthProviders = await getEnabledOAuthProviders().catch(() => ({ google: false, apple: false }));
  const initialError = error === "callback" ? "No pudimos completar el acceso. El enlace puede haber vencido o ya haberse usado. Intenta iniciar sesión de nuevo." : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
        <SubpageHeader
          eyebrow="Cuenta de familia"
          title="Iniciar sesión"
          description="Administra la identidad y la información pública de tus mascotas con una cuenta PawPass."
        />
        <div className="mt-6 max-w-xl">
          <LoginForm oauthProviders={oauthProviders} initialError={initialError} />
        </div>
      </div>
    </AppShell>
  );
}
