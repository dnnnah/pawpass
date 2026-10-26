import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { CalendarDays, PawPrint } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { Surface } from "@/components/ui/Surface";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";
import { normalizeAccountPetRow, type AccountPet } from "@/lib/account/pets";
import { LogoutButton } from "./LogoutButton";
import { CreatePetForm } from "./CreatePetForm";
import { LostStatusForm } from "./LostStatusForm";
import { AdoptionPublicationForm } from "@/components/features/adoption/AdoptionPublicationForm";
import { ShelterAdoptionSection } from "./ShelterAdoptionSection";

export const metadata: Metadata = {
  title: "Mi cuenta | PawPass",
  description: "Mascotas asociadas a tu cuenta de PawPass.",
};

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value));
}

async function getAccountPets(): Promise<{ pets: AccountPet[]; error: string | null }> {
  if (!hasSupabaseEnv()) {
    return { pets: [], error: "Supabase todavía no está configurado para esta instalación." };
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options);
      } catch {
        // Server Components pueden leer la sesión aunque no puedan escribir cookies.
      }
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cuenta");

  const { data, error } = await supabase
    .from("pet_ownerships")
    .select("pet_id, rol, started_at, pets(id, codigo_publico, nombre, especie, estado, slug, raza)")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false });

  if (error) return { pets: [], error: "No pudimos cargar tus mascotas. Intenta de nuevo." };

  const pets = (data ?? []).map(normalizeAccountPetRow).filter((pet): pet is AccountPet => pet !== null);
  if (pets.length === 0) return { pets, error: null };

  const { data: photos, error: photoError } = await supabase
    .from("pet_documents")
    .select("pet_id, object_path, created_at")
    .in("pet_id", pets.map((pet) => pet.id))
    .eq("bucket_id", "pawpass-fotos")
    .eq("categoria", "foto")
    .eq("tipo", "imagen")
    .order("created_at", { ascending: true });

  if (photoError) return { pets, error: "No pudimos cargar las fotos privadas de tus mascotas." };

  const firstPhotoByPet = new Map<string, string>();
  for (const photo of photos ?? []) {
    if (!firstPhotoByPet.has(photo.pet_id)) firstPhotoByPet.set(photo.pet_id, photo.object_path);
  }

  const withPhotos = await Promise.all(pets.map(async (pet) => {
    const path = firstPhotoByPet.get(pet.id);
    if (!path) return { ...pet, photoUrl: null };
    const { data: signed } = await supabase.storage.from("pawpass-fotos").createSignedUrl(path, 300);
    return { ...pet, photoUrl: signed?.signedUrl ?? null };
  }));

  return { pets: withPhotos, error: null };
}

export default async function CuentaPage() {
  const { pets, error } = await getAccountPets();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="space-y-7">
          <SubpageHeader
            eyebrow="Cuenta de tutor"
            title="Tus mascotas"
            description="Consulta las mascotas asociadas a tu cuenta y registra una nueva cuando quieras."
            action={<LogoutButton />}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
            <CreatePetForm />

            {error ? (
              <Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}>
                <h2 className="font-semibold text-ink">No pudimos cargar la cuenta</h2>
                <p className="mt-1 text-sm leading-6 text-ink-2">{error}</p>
              </Surface>
            ) : pets.length === 0 ? (
              <Surface variant="outline" size="lg" className="text-center">
                <PawPrint className="mx-auto text-brand" size={26} aria-hidden="true" />
                <h2 className="mt-4 font-display text-2xl text-ink">Aún no tienes mascotas asociadas</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-2">
                  Las mascotas que registres aparecerán aquí. Su ficha y sus fotos permanecen privadas en tu cuenta.
                </p>
                <Button href="/" variant="secondary" className="mt-5">Volver al inicio</Button>
              </Surface>
            ) : (
              <section aria-labelledby="mascotas-cuenta-titulo">
                <h2 id="mascotas-cuenta-titulo" className="sr-only">Mascotas asociadas</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pets.map((pet) => (
                    <Surface key={pet.id} as="article" size="md" className="flex flex-col">
                      {pet.photoUrl ? <Image src={pet.photoUrl} alt={`Foto de ${pet.name}`} width={800} height={600} unoptimized className="mb-4 aspect-[4/3] w-full rounded-md object-cover" /> : (
                        <span className="mb-4 grid aspect-[4/3] w-full place-items-center rounded-md bg-brand-soft text-brand"><PawPrint size={30} aria-hidden="true" /></span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-xl text-ink">{pet.name}</h3>
                          <p className="mt-1 text-sm text-ink-2">{pet.species === "perro" ? "Perro" : "Gato"}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                        </div>
                      </div>
                      <dl className="mt-5 border-t border-rule pt-4 text-sm">
                        <div>
                          <dt className="text-ink-3">Registrada desde</dt>
                          <dd className="mt-1 flex items-center gap-1.5 font-semibold text-ink"><CalendarDays size={14} aria-hidden="true" />{formatDate(pet.startedAt)}</dd>
                        </div>
                      </dl>
                      <Button href={`/cuenta/mascotas/${pet.id}`} variant="secondary" className="mt-5 w-full">
                        Abrir carnet privado
                      </Button>
                      <AdoptionPublicationForm
                        petId={pet.id}
                        petName={pet.name}
                        status={pet.status}
                        canEdit={pet.role === "administrador"}
                      />
                      {pet.role === "administrador" ? <LostStatusForm petId={pet.id} petName={pet.name} status={pet.status} canEdit /> : null}
                    </Surface>
                  ))}
                </div>
              </section>
            )}
          </div>
          <ShelterAdoptionSection />
        </div>
      </div>
    </AppShell>
  );
}
