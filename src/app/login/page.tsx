import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";

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
          description="El panel con tus mascotas estará disponible próximamente. Por ahora puedes explorar los perfiles públicos."
        />
      </div>
    </AppShell>
  );
}
