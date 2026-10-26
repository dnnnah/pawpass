import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { PublicPetsSection } from "@/components/features/home/PublicPetsSection";
import { getAccountPets } from "./accountData";
import { AccountPetsDashboard } from "./AccountPetsDashboard";
import { DeleteDataControl } from "./DeleteDataControl";
import { LogoutButton } from "./LogoutButton";
import { ShelterAdoptionSection } from "./ShelterAdoptionSection";

export const metadata: Metadata = {
  title: "Mi cuenta | PawPass",
  description: "Mis mascotas, sus carnets privados y la configuración de mi cuenta.",
};
export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const { pets, error } = await getAccountPets();
  return <AppShell>
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-12 sm:px-6 lg:px-8">
      <SubpageHeader eyebrow="Cuenta de tutor" title="Mi cuenta" description="Tus mascotas y sus carnets privados, en un solo lugar." action={<LogoutButton />} />
      <AccountPetsDashboard pets={pets} error={error} />
      <PublicPetsSection />
      <ShelterAdoptionSection />
      <section aria-labelledby="configuracion-cuenta-titulo" className="border-t border-rule pt-6">
        <h2 id="configuracion-cuenta-titulo" className="font-display text-xl text-ink">Configuración de mi cuenta</h2>
        <DeleteDataControl petsCount={pets.length} />
      </section>
    </div>
  </AppShell>;
}
