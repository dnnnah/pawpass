import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Surface } from "@/components/ui/Surface";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { Pill } from "@/components/ui/Pill";
import { getPetByIdAny, getAllProfilePets } from "@/lib/services/pets/queries";
import { toVaccineSummaryViewModel } from "@/lib/mapping/health";
import { notFound } from "next/navigation";
import { ProfileViewTracker } from "@/components/telemetry/ProfileViewTracker";
import { VaccineListClient } from "./VaccineListClient";

type VaccinesPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const pets = await getAllProfilePets();

  return pets.flatMap((pet) => [
    { id: pet.id },
    { id: pet.identificacion.codigoPublico },
  ]);
}

export async function generateMetadata({ params }: VaccinesPageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    return {
      title: "Vacunas no encontradas | PawPass",
    };
  }

  return {
    title: `Vacunas de ${pet.mascota.nombre} | PawPass`,
    description: `Cartilla de vacunación de ${pet.mascota.nombre}.`,
  };
}

export default async function VaccinesPage({ params }: VaccinesPageProps) {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    notFound();
  }

  const { total, al_dia, proxima_dosis, vencida, desconocido } = toVaccineSummaryViewModel(
    pet.vacunas,
  );

  return (
    <AppShell>
      <ProfileViewTracker section="private" />
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href={`/perfil/${pet.id}`} />

          <SubpageHeader
            eyebrow="Cartilla de vacunación"
            title={`Vacunas de ${pet.mascota.nombre}`}
            description="Registro completo del esquema de vacunación."
          />

          {total > 0 ? (
            <div className="flex flex-wrap gap-2">
              {al_dia > 0 ? <Pill tone="success">{al_dia} al día</Pill> : null}
              {proxima_dosis > 0 ? (
                <Pill tone="warning">{proxima_dosis} próxima dosis</Pill>
              ) : null}
              {vencida > 0 ? <Pill tone="danger">{vencida} vencidas</Pill> : null}
              {desconocido > 0 ? <Pill tone="muted">{desconocido} sin estado</Pill> : null}
            </div>
          ) : null}

          {total > 0 ? (
            <Surface className="p-5 sm:p-6">
              <VaccineListClient
                petName={pet.mascota.nombre}
                vaccines={pet.vacunas}
                documents={pet.documentos}
              />
            </Surface>
          ) : (
            <Surface className="p-8 text-center">
              <ShieldCheck size={26} aria-hidden="true" className="mx-auto text-ink-3" />
              <p className="mt-3 font-display text-2xl text-ink">Sin vacunas registradas</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-ink-2">
                Aún no se han registrado vacunas para {pet.mascota.nombre}.
              </p>
            </Surface>
          )}
        </div>
      </div>
    </AppShell>
  );
}