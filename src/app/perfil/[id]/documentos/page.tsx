import type { Metadata } from "next";
import { Folder } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Surface } from "@/components/ui/Surface";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { DocumentListClient } from "./DocumentListClient";
import { getPetByIdAny, getAllProfilePets } from "@/lib/services/pets/queries";
import { getPublicDocuments } from "@/lib/petDocuments";
import { notFound } from "next/navigation";
import { ProfileViewTracker } from "@/components/telemetry/ProfileViewTracker";

type DocumentsPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const pets = await getAllProfilePets();

  return pets.flatMap((pet) => [{ id: pet.id }, { id: pet.identificacion.codigoPublico }]);
}

export async function generateMetadata({ params }: DocumentsPageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    return {
      title: "Documentos no encontrados | PawPass",
    };
  }

  return {
    title: `Documentos de ${pet.mascota.nombre} | PawPass`,
    description: `Documentos públicos de ${pet.mascota.nombre}.`,
  };
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { id } = await params;
  const pet = await getPetByIdAny(id);

  if (!pet) {
    notFound();
  }

  const documents = getPublicDocuments(pet).filter(
    (document) => document.categoria !== "foto"
  );

  return (
    <AppShell>
      <ProfileViewTracker section="private" />
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BackLink href={`/perfil/${pet.id}`} />

          <SubpageHeader
            eyebrow="Documentos públicos"
            title={`Documentos de ${pet.mascota.nombre}`}
            description="Archivos compartidos por su familia para consulta rápida."
          />

          {documents.length > 0 ? (
            <DocumentListClient documents={documents} />
          ) : (
            <Surface className="p-8 text-center">
              <Folder size={26} aria-hidden="true" className="mx-auto text-ink-3" />
              <p className="mt-3 font-display text-2xl text-ink">No hay documentos públicos</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-ink-2">
                Los documentos privados no se muestran en el perfil público.
              </p>
            </Surface>
          )}
        </div>
      </div>
    </AppShell>
  );
}
