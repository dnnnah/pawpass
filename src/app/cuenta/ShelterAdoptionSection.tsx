import { cookies } from "next/headers";
import { Building2, PawPrint } from "lucide-react";
import { AdoptionPublicationForm } from "@/components/features/adoption/AdoptionPublicationForm";
import { Surface } from "@/components/ui/Surface";
import { normalizeShelterAdoptionPets } from "@/lib/account/shelterAdoptionPets";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";
import { createSupabaseServerClient } from "@/lib/infra/supabase/server";

type ShelterMembership = {
  shelter_id: string;
  shelters: { slug: string | null; nombre: string } | { slug: string | null; nombre: string }[] | null;
};

function asShelter(value: ShelterMembership["shelters"]) {
  const shelter = Array.isArray(value) ? value[0] : value;
  if (!shelter || typeof shelter.nombre !== "string" || !shelter.nombre.trim()) return null;
  return { name: shelter.nombre.trim(), slug: shelter.slug?.trim() || null };
}

export async function ShelterAdoptionSection() {
  if (!hasSupabaseEnv()) return null;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const cookie of cookiesToSet) cookieStore.set(cookie.name, cookie.value, cookie.options);
      } catch {
        // La lectura de sesión funciona en Server Components aunque no escriban cookies.
      }
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("shelter_memberships")
    .select("shelter_id, shelters!shelter_memberships_shelter_id_fkey(slug,nombre)")
    .eq("user_id", user.id);

  if (error) {
    return (
      <Surface variant="accent" tone="danger" rest={{ role: "alert" }}>
        <h2 className="font-semibold text-ink">No pudimos cargar las mascotas de tus refugios</h2>
        <p className="mt-1 text-sm leading-6 text-ink-2">Intenta de nuevo más tarde.</p>
      </Surface>
    );
  }

  const memberships = (data ?? []) as unknown as ShelterMembership[];
  const shelters = memberships
    .map((membership) => ({ membership, shelter: asShelter(membership.shelters) }))
    .filter((row): row is { membership: ShelterMembership; shelter: NonNullable<ReturnType<typeof asShelter>> } => Boolean(row.shelter));

  if (shelters.length === 0) return null;

  const groups = await Promise.all(shelters.map(async ({ membership, shelter }) => {
    const { data: petRows, error: petsError } = await supabase.rpc("listar_mascotas_refugio_adopcion", {
      p_refugio: membership.shelter_id,
    });
    return {
      id: membership.shelter_id,
      ...shelter,
      error: Boolean(petsError),
      pets: normalizeShelterAdoptionPets(petRows),
    };
  }));

  return (
    <section aria-labelledby="refugios-cuenta-titulo" className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Cuenta de refugio</p>
        <h2 id="refugios-cuenta-titulo" className="mt-1 font-display text-2xl text-ink">Mascotas de tus refugios</h2>
        <p className="mt-1 text-sm leading-6 text-ink-2">
          Publica para adopción las mascotas vinculadas a los refugios que administras.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((group) => (
          <Surface key={group.id} as="article" size="md">
            <h3 className="flex items-center gap-2 font-display text-xl text-ink">
              <Building2 size={18} className="text-brand" aria-hidden="true" />
              {group.name}
            </h3>
            {group.error ? (
              <p role="alert" className="mt-4 text-sm text-danger">No pudimos cargar las mascotas de este refugio.</p>
            ) : group.pets.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-ink-2">No hay mascotas vinculadas y disponibles para publicar.</p>
            ) : (
              <div className="mt-4 divide-y divide-rule">
                {group.pets.map((pet) => (
                  <div key={pet.id} className="py-4 first:pt-0 last:pb-0">
                    <h4 className="flex items-center gap-2 font-semibold text-ink">
                      <PawPrint size={15} className="text-ink-3" aria-hidden="true" />
                      {pet.name}
                    </h4>
                    <p className="mt-1 text-xs text-ink-3">{pet.species} · {pet.publicCode}</p>
                    <AdoptionPublicationForm
                      petId={pet.id}
                      petName={pet.name}
                      status={pet.status}
                      canEdit
                      shelterId={group.id}
                      actorLabel={`el refugio ${group.name}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </Surface>
        ))}
      </div>
    </section>
  );
}
