import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { AccountPetsDashboard } from "@/app/cuenta/AccountPetsDashboard";
import { getAccountPets } from "@/app/cuenta/accountData";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Mis mascotas | PawPass",
  description: "Administra las mascotas asociadas a tu cuenta PawPass.",
};
export const dynamic = "force-dynamic";

export default async function MisMascotasPage() {
  const { pets, error } = await getAccountPets(true, "/mis-mascotas");
  return <AppShell>
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-12 sm:px-6 lg:px-8">
      <SubpageHeader
        eyebrow="Espacio privado"
        title="Mis mascotas"
        description="Administra sus carnets privados y revisa primero las alertas activas."
        action={<Button href="/cuenta" variant="secondary">Mi cuenta</Button>}
      />
      <AccountPetsDashboard pets={pets} error={error} />
    </div>
  </AppShell>;
}
