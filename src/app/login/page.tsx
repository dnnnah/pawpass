import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión | PawPass",
  description: "Acceso al panel de PawPass.",
};

export default function LoginPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
        <SubpageHeader
          eyebrow="Cuenta de familia"
          title="Iniciar sesión"
          description="Administra la identidad y la información pública de tus mascotas con una cuenta PawPass."
        />
        <div className="mt-6 max-w-xl">
          <LoginForm />
        </div>
      </div>
    </AppShell>
  );
}
