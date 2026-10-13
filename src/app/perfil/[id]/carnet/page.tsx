import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { CarnetStudio } from "@/components/features/carnet/CarnetStudio";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { buildPhysicalPetCard } from "@/lib/domain/carnet";
import { getPetByIdAny, getAllProfilePets } from "@/lib/services/pets/queries";
import type { PhysicalPetCardFormato } from "@/types/carnet";
import { notFound } from "next/navigation";

type CarnetPageProps = {
  params: Promise<{ id: string }>;
};

const FORMATOS: PhysicalPetCardFormato[] = ["tarjeta_imprimible", "credencial", "placa_dije"];

export async function generateStaticParams() {
  const pets = await getAllProfilePets();

  return pets.flatMap((pet) => [{ id: pet.id }, { id: pet.identificacion.codigoPublico }]);
}

export async function generateMetadata({ params }: CarnetPageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    return {
      title: "Carnet no encontrado | PetCarnet",
    };
  }

  return {
    title: `Carnet físico de ${pet.mascota.nombre} | PetCarnet`,
    description: `Carnet físico de ${pet.mascota.nombre}: identidad, perfil público, contacto y salud para imprimir.`,
  };
}

export default async function CarnetPage({ params }: CarnetPageProps) {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    notFound();
  }

  const cards = Object.fromEntries(
    FORMATOS.map((formato) => [formato, buildPhysicalPetCard(pet, { formato })]),
  ) as Record<PhysicalPetCardFormato, ReturnType<typeof buildPhysicalPetCard>>;

  return (
    <AppShell>
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