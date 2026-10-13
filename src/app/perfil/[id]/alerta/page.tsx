import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { LostPetAlertForm } from "@/components/features/lost-pet/LostPetAlertForm";
import { isTerminalPetStatus } from "@/lib/domain/petStatus";
import { getPetByIdAny, getAllProfilePets } from "@/lib/services/pets/queries";
import { notFound } from "next/navigation";

type AlertPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const pets = await getAllProfilePets();

  return pets.flatMap((pet) => [{ id: pet.id }, { id: pet.identificacion.codigoPublico }]);
}

export async function generateMetadata({ params }: AlertPageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    return {
      title: "Alerta no encontrada | PetCarnet",
    };
  }

  const isTerminal = isTerminalPetStatus(pet.estado);

  return {
    title: isTerminal
      ? `En memoria de ${pet.mascota.nombre} | PetCarnet`
      : `Generar alerta de ${pet.mascota.nombre} | PetCarnet`,
    description: isTerminal
      ? `El perfil de ${pet.mascota.nombre} se conserva como recuerdo en PetCarnet.`
      : `Genera una imagen de alerta para compartir cuando ${pet.mascota.nombre} está perdido.`,
  };
}

export default async function AlertPage({ params }: AlertPageProps) {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    notFound();
  }

  const isTerminal = isTerminalPetStatus(pet.estado);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href={`/perfil/${pet.id}`} />

          <SubpageHeader
            eyebrow={isTerminal ? "Estado terminal" : "Generar alerta"}
            title={isTerminal ? `En memoria de ${pet.mascota.nombre}` : `Alerta de ${pet.mascota.nombre}`}
            description={isTerminal
              ? "El estado actual de este perfil no admite la generación de alertas de mascota perdida."
              : "Genera una imagen para compartir en redes sociales y mensajería cuando tu mascota esté perdida."}
          />

          {!isTerminal ? <LostPetAlertForm pet={pet} /> : null}
        </div>
      </div>
    </AppShell>
  );
}
