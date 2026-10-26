import { PetsList } from "./PetsList";
import { listActivePublicProfiles } from "@/lib/infra/directory/activePublicProfiles";
import type { PublicProfileCard } from "@/types/publicProfile";

export async function PublicPetsSection() {
  let pets: PublicProfileCard[] = [];
  let failed = false;
  try { pets = await listActivePublicProfiles(); } catch { failed = true; }

  return <section aria-labelledby="perfiles-publicos-titulo" className="border-t border-rule pt-8">
    <h2 id="perfiles-publicos-titulo" className="font-display text-2xl text-ink">Mascotas públicas</h2>
    <p className="mt-2 text-sm leading-6 text-ink-2">Conoce las mascotas cuyos responsables decidieron compartir su perfil.</p>
    <PetsList pets={pets} failed={failed} />
  </section>;
}
