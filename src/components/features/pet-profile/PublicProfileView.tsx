import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import type { PublicProfile } from "@/types/publicProfile";

function Detail({ label, value }: { label: string; value: string | null }) {
  return value ? <div><dt className="text-sm text-ink-3">{label}</dt><dd className="mt-1 font-medium text-ink">{value}</dd></div> : null;
}

function contactHref(kind: "tel" | "whatsapp" | "email", value: string) {
  if (kind === "whatsapp") return `https://wa.me/${value.replace(/\D/g, "")}`;
  return `${kind}:${value}`;
}

export function PublicProfileView({ profile }: { profile: PublicProfile }) {
  const contacts = [
    profile.contact.phone ? { label: "Llamar", href: contactHref("tel", profile.contact.phone) } : null,
    profile.contact.whatsapp ? { label: "WhatsApp", href: contactHref("whatsapp", profile.contact.whatsapp) } : null,
    profile.contact.email ? { label: "Enviar correo", href: contactHref("email", profile.contact.email) } : null,
  ].filter((item): item is { label: string; href: string } => item !== null);

  return <AppShell>
    <article className="mx-auto max-w-4xl space-y-6 px-4 pb-12 sm:px-6 lg:px-8">
      <header className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Perfil público voluntario</p>
          <h1 className="mt-2 font-display text-4xl text-ink">{profile.name}</h1>
          <p className="mt-2 text-ink-2">{profile.species}{profile.breed ? ` · ${profile.breed}` : ""}</p>
          <p className="mt-1 text-xs text-ink-3">Código PawPass {profile.publicCode}</p>
        </div>
        {profile.photoUrl ? <Image src={profile.photoUrl} alt={`Foto de ${profile.name}`} width={560} height={420} unoptimized className="aspect-[4/3] w-full rounded-lg object-cover" priority /> : null}
      </header>

      <Surface as="section" size="md" rest={{ "aria-labelledby": "datos-publicos" }}>
        <h2 id="datos-publicos" className="font-display text-2xl text-ink">Sobre {profile.name}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Detail label="Fecha de nacimiento" value={profile.birthDate} />
          <Detail label="Sexo" value={profile.gender} />
          <Detail label="Tamaño" value={profile.size} />
          <Detail label="Color" value={profile.color} />
          <Detail label="Zona aproximada" value={profile.zone} />
          <Detail label="Microchip" value={profile.microchip} />
          <Detail label="Esterilizado" value={profile.sterilized === null ? null : profile.sterilized ? "Sí" : "No"} />
        </dl>
        {profile.traits.length ? <div className="mt-5"><h3 className="font-semibold text-ink">Rasgos distintivos</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-2">{profile.traits.map((trait) => <li key={trait}>{trait}</li>)}</ul></div> : null}
      </Surface>

      {profile.emergencyCareNote ? <Surface as="section" variant="accent" size="md" rest={{ "aria-labelledby": "cuidados-emergencia" }}><h2 id="cuidados-emergencia" className="font-display text-xl text-ink">Cuidados importantes</h2><p className="mt-2 text-sm leading-6 text-ink-2">{profile.emergencyCareNote}</p></Surface> : null}

      {contacts.length ? <Surface as="section" size="md" rest={{ "aria-labelledby": "contacto-dueno" }}><h2 id="contacto-dueno" className="font-display text-xl text-ink">Contacto</h2>{profile.contact.name ? <p className="mt-1 text-sm text-ink-2">{profile.contact.name}</p> : null}<div className="mt-4 flex flex-wrap gap-2">{contacts.map((contact) => <Button key={contact.label} href={contact.href} variant="secondary">{contact.label}</Button>)}</div></Surface> : null}

      {profile.health ? <Surface as="section" size="md" rest={{ "aria-labelledby": "salud-publica" }}><h2 id="salud-publica" className="font-display text-xl text-ink">Salud y cuidados</h2><dl className="mt-4 grid gap-4"><Detail label="Alergias" value={profile.health.allergies.join(", ") || null} /><Detail label="Condiciones" value={profile.health.conditions.join(", ") || null} /><Detail label="Medicamentos" value={profile.health.medications.join(", ") || null} /><Detail label="Alimentación" value={profile.health.diet} /><Detail label="Comportamiento" value={profile.health.behavior} /></dl></Surface> : null}

      {profile.vaccines.length ? <Surface as="section" size="md" rest={{ "aria-labelledby": "vacunas-publicas" }}><h2 id="vacunas-publicas" className="font-display text-xl text-ink">Vacunas compartidas</h2><ul className="mt-3 divide-y divide-rule">{profile.vaccines.map((vaccine) => <li key={`${vaccine.name}-${vaccine.applicationDate}`} className="py-3"><p className="font-semibold text-ink">{vaccine.name}</p><p className="mt-1 text-sm text-ink-2">Aplicada: {vaccine.applicationDate}{vaccine.nextDose ? ` · Próxima dosis: ${vaccine.nextDose}` : ""}</p></li>)}</ul></Surface> : null}

      {profile.photos.length ? <Surface as="section" size="md" rest={{ "aria-labelledby": "fotos-publicas" }}><h2 id="fotos-publicas" className="font-display text-xl text-ink">Más fotos</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{profile.photos.map((photo, index) => <Image key={photo.url} src={photo.url} alt={`Foto ${index + 1} de ${profile.name}`} width={800} height={600} unoptimized className="aspect-[4/3] w-full rounded-md object-cover" />)}</div></Surface> : null}

      {profile.documents.length ? <Surface as="section" size="md" rest={{ "aria-labelledby": "documentos-publicos" }}><h2 id="documentos-publicos" className="font-display text-xl text-ink">Documentos compartidos</h2><ul className="mt-3 divide-y divide-rule">{profile.documents.map((document) => <li key={`${document.name}-${document.url}`} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium text-ink">{document.name}</p><p className="text-xs text-ink-3">{document.category}{document.date ? ` · ${document.date}` : ""}</p></div><a className="text-sm font-semibold text-brand underline" href={document.url} target="_blank" rel="noreferrer">Abrir documento</a></li>)}</ul></Surface> : null}

      <footer className="text-center text-xs text-ink-3">La información la comparte la persona responsable de {profile.name}. Consulta el QR para los datos de rescate.</footer>
    </article>
  </AppShell>;
}
