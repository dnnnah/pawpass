import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { CarnetStudio } from "@/components/features/carnet/CarnetStudio";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { buildPhysicalPetCard } from "@/lib/domain/carnet";
import { getPetByIdAny, getAllProfilePets } from "@/lib/services/pets/queries";
import type { PhysicalPetCardFormato } from "@/types/carnet";
import { notFound } from "next/navigation";
import { ProfileViewTracker } from "@/components/telemetry/ProfileViewTracker";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { findActivePublicProfile } from "@/lib/infra/directory/activePublicProfiles";
import { toPublicPhysicalPetCard } from "@/lib/mapping/publicProfile";

type CarnetPageProps = {
  params: Promise<{ id: string }>;
};

const FORMATOS: PhysicalPetCardFormato[] = ["tarjeta_imprimible", "credencial", "placa_dije"];

export async function generateStaticParams() {
  if (hasSupabaseEnv() || process.env.NODE_ENV === "production") return [];
  const pets = await getAllProfilePets();

  return pets.flatMap((pet) => [{ id: pet.id }, { id: pet.identificacion.codigoPublico }]);
}

export async function generateMetadata({ params }: CarnetPageProps): Promise<Metadata> {
  const { id } = await params;
  if (hasSupabaseEnv()) {
    try {
      const profile = await findActivePublicProfile(id);
      if (!profile) return { title: "Carnet no disponible | PawPass", robots: { index: false, follow: false } };
      return {
        title: `Carnet físico de ${profile.name} | PawPass`,
        description: `Carnet físico de ${profile.name} elaborado con los datos compartidos en su perfil público.`,
        robots: { index: true, follow: true },
      };
    } catch {
      return { title: "Carnet temporalmente no disponible | PawPass", robots: { index: false, follow: false } };
    }
  }
  if (process.env.NODE_ENV === "production") {
    return { title: "Carnet no disponible | PawPass", robots: { index: false, follow: false } };
  }
  const pet = await getPetByIdAny(id);

  if (!pet) {
    return {
      title: "Carnet no encontrado | PawPass",
    };
  }

  return {
    title: `Carnet físico de ${pet.mascota.nombre} | PawPass`,
    description: `Carnet físico de ${pet.mascota.nombre}: identidad, perfil público, contacto y salud para imprimir.`,
  };
}

export default async function CarnetPage({ params }: CarnetPageProps) {
  const { id } = await params;
  const printTracker = <ProfileViewTracker section="print" />;
  if (hasSupabaseEnv()) {
    const profile = await findActivePublicProfile(id);
    if (!profile) notFound();
    const cards = Object.fromEntries(
      FORMATOS.map((formato) => [formato, toPublicPhysicalPetCard(profile, formato)]),
    ) as Record<PhysicalPetCardFormato, ReturnType<typeof toPublicPhysicalPetCard>>;

    return (
      <AppShell>
        {printTracker}
        <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <BackLink href={`/perfil/${profile.publicCode}`} />
            <SubpageHeader
              eyebrow="Carnet físico · PawPass"
              title={`Carnet de ${profile.name}`}
              description="La identidad física de la mascota, preparada con los datos compartidos en su perfil público."
            />
            <CarnetStudio petName={profile.name} cards={cards} sharedOnly />
            <p className="text-center text-sm text-ink-2">
              Los tres formatos se preparan con la información pública del perfil y conservan el QR de PawPass.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }
  if (process.env.NODE_ENV === "production") notFound();

  const pet = await getPetByIdAny(id);

  if (!pet) {
    notFound();
  }

  const cards = Object.fromEntries(
    FORMATOS.map((formato) => [formato, buildPhysicalPetCard(pet, { formato })]),
  ) as Record<PhysicalPetCardFormato, ReturnType<typeof buildPhysicalPetCard>>;

  return (
    <AppShell>
      {printTracker}
      {/* El estudio del carnet existe para imprimir: es su propia sección del
          contrato, distinta de la ficha pública y del expediente. */}
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href={`/perfil/${pet.id}`} />

          <SubpageHeader
            eyebrow="Carnet físico · Kit con Causa"
            title={`Carnet de ${pet.mascota.nombre}`}
            description="La identidad física de la mascota: identificación, QR con su perfil público, contacto y salud. Cambia entre formatos para imprimir."
          />

          <CarnetStudio petName={pet.mascota.nombre} cards={cards} />

          <p className="text-center text-sm text-ink-2">
            Los tres formatos se derivan del mismo modelo de core y respetan el QR mínimo de impresión.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
