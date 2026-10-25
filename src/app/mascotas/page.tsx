import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/ui/SubpageHeader";
import { Surface } from "@/components/ui/Surface";
import { listActivePublicProfiles } from "@/lib/infra/directory/activePublicProfiles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mascotas con perfil público | PawPass",
  description: "Conoce a las mascotas cuyos responsables eligieron compartir su perfil en PawPass.",
};

export default async function MascotasPage() {
  let profiles = null;
  let failed = false;
  try {
    profiles = await listActivePublicProfiles();
  } catch {
    failed = true;
  }

  return <AppShell>
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
      <SubpageHeader eyebrow="Perfiles voluntarios" title="Mascotas" description="Aquí aparecen las mascotas cuyos responsables eligieron activar un perfil público. Cada perfil muestra solo los datos y archivos que decidieron compartir." />
      {failed ? <Surface variant="accent" tone="danger" size="md" rest={{ role: "alert" }}><h2 className="font-semibold text-ink">No pudimos cargar los perfiles públicos</h2><p className="mt-1 text-sm leading-6 text-ink-2">Intenta volver a cargar esta página más tarde.</p></Surface> : profiles?.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{profiles.map((profile) => <li key={profile.publicCode}><Link href={`/perfil/${profile.publicCode}`} className="group block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><Surface as="article" size="md" className="h-full transition-colors group-hover:border-brand-rule">{profile.photoUrl ? <Image src={profile.photoUrl} alt={`Foto de ${profile.name}`} width={800} height={600} unoptimized className="mb-4 aspect-[4/3] w-full rounded-md object-cover" /> : <span className="mb-4 grid aspect-[4/3] w-full place-items-center rounded-md bg-brand-soft text-brand"><PawPrint size={30} aria-hidden="true" /></span>}<h2 className="font-display text-2xl text-ink">{profile.name}</h2><p className="mt-1 text-sm text-ink-2">{profile.species}{profile.breed ? ` · ${profile.breed}` : ""}</p>{profile.zone ? <p className="mt-2 text-sm text-ink-3">{profile.zone}</p> : null}<span className="mt-4 inline-block text-sm font-semibold text-brand underline">Ver perfil</span></Surface></Link></li>)}</ul> : <Surface variant="outline" size="lg" className="text-center"><PawPrint className="mx-auto text-brand" size={26} aria-hidden="true" /><h2 className="mt-4 font-display text-2xl text-ink">Aún no hay perfiles públicos</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-2">Cuando una persona responsable active la publicación de una mascota, aparecerá aquí.</p></Surface>}
    </div>
  </AppShell>;
}
