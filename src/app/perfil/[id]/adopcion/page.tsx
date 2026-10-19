import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Ban, HeartCrack } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/ui/BackLink";
import { Surface } from "@/components/ui/Surface";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { AdoptionRequestForm } from "@/components/features/adoption/AdoptionRequestForm";
import { resolveAdoptionAvailability } from "@/lib/domain/adoption";
import { isTerminalPetStatus } from "@/lib/domain/petStatus";
import { findShelterForPet } from "@/lib/domain/shelter";
import { getPetStatusMeta } from "@/lib/mapping/petStatusPresentation";
import { getPetByIdAny, getAdoptionDemoPets } from "@/lib/services/pets/queries";
import { getMockShelters } from "@/lib/services/shelters/queries";

type AdoptionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const pets = await getAdoptionDemoPets();

  return pets.flatMap((pet) => [
    { id: pet.id },
    { id: pet.identificacion.codigoPublico },
  ]);
}

export async function generateMetadata({ params }: AdoptionPageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    return {
      title: "Solicitud no encontrada | PawPass",
      robots: { index: false },
    };
  }

  return {
    title: `Solicitar adopción de ${pet.mascota.nombre} | PawPass`,
    description: `Solicitud de adopción prototipo para ${pet.mascota.nombre} (${pet.mascota.especie}) en PawPass.`,
  };
}

export default async function AdoptionRequestPage({ params }: AdoptionPageProps) {
  const { id } = await params;
  const [pet, shelters] = await Promise.all([getPetByIdAny(id), getMockShelters()]);

  if (!pet) {
    notFound();
  }

  const shelter = findShelterForPet(pet.id, shelters);
  const availability = resolveAdoptionAvailability({
    estado: pet.estado,
    emergencia: pet.emergencia,
    alert: null,
  });
  const isTerminal = isTerminalPetStatus(pet.estado);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href={`/perfil/${pet.id}`}>
            Volver al perfil de {pet.mascota.nombre}
          </BackLink>

          <SubpageHeader
            eyebrow="Solicitud de adopción"
            title={`Adoptar a ${pet.mascota.nombre}`}
            description="Completa el formulario para registrar tu interés. En este prototipo la solicitud se guarda solo en este navegador y no se envía a ningún servidor."
          />

          {!availability.available ? (
            <Surface className="p-6 sm:p-8">
              <div className="max-w-md">
                <span
                  aria-hidden="true"
                  className={[
                    "grid size-14 place-items-center rounded-md",
                    isTerminal ? "bg-sunken text-ink-3" : "bg-danger-soft text-danger",
                  ].join(" ")}
                >
                  {isTerminal ? (
                    <HeartCrack size={26} />
                  ) : (
                    <Ban size={26} />
                  )}
                </span>
                <h3 className="mt-4 font-display text-2xl leading-snug text-ink">
                  No es posible solicitar la adopción
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">
                  El estado actual de {pet.mascota.nombre} es{" "}
                  <strong className="font-semibold text-ink">
                    {getPetStatusMeta(availability.effectiveStatus).label}
                  </strong>
                  , por lo que no está disponible para adopción en este momento.
                </p>
                <div className="mt-5">
                  <BackLink href={`/perfil/${pet.id}`}>Volver al perfil</BackLink>
                </div>
              </div>
            </Surface>
          ) : (
            <AdoptionRequestForm pet={pet} shelterName={shelter?.nombre ?? null} />
          )}
        </div>
      </div>
    </AppShell>
  );
}