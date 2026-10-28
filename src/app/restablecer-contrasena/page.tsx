import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { safeAuthNextPath } from "@/lib/authRedirect";
import { PasswordResetForm } from "./PasswordResetForm";

export const metadata: Metadata = {
  title: "Nueva contraseña | PawPass",
  description: "Restablece la contraseña de tu cuenta PawPass.",
  robots: { index: false, follow: false },
};

export default async function PasswordResetPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return <AppShell>
    <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
      <SubpageHeader eyebrow="Cuenta de familia" title="Recupera tu acceso" description="Valida el enlace que recibiste y elige una contraseña nueva." />
      <div className="mt-6 max-w-xl">
        <PasswordResetForm nextPath={safeAuthNextPath(params.next)} expired={params.error === "expired"} />
      </div>
    </div>
  </AppShell>;
}
