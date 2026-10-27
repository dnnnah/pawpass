import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Bone, HeartHandshake, PawPrint } from "lucide-react";
import { PublicCodeAccess } from "@/components/features/home/PublicCodeAccess";

const sections = [
  { href: "/mis-mascotas", label: "Mis mascotas", description: "Carnets privados y datos de tu familia.", icon: PawPrint },
  { href: "/perdidas", label: "Perdidas", description: "Alertas activas para ayudar a que vuelvan a casa.", icon: AlertTriangle },
  { href: "/mascotas", label: "Mascotas", description: "Perfiles que sus familias decidieron compartir.", icon: Bone },
  { href: "/adopciones", label: "Adopciones", description: "Mascotas y refugios participantes.", icon: HeartHandshake },
] as const;

export function HomeSectionLinks() {
  return <div className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6 sm:pb-16">
    <header className="py-9 sm:py-12">
      <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">Mascotas</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink-2">PawPass guarda el carnet de tu mascota y permite que otras personas consulten los datos básicos que compartes en su QR para ayudarla a volver a casa.</p>
    </header>

    <div className="mb-8"><PublicCodeAccess /></div>

    <nav aria-label="Secciones principales">
      <ul className="divide-y divide-rule border-y border-rule">
        {sections.map(({ href, label, description, icon: Icon }) => <li key={href}>
          <Link href={href} className="group flex min-h-20 items-center gap-4 py-4 text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-on-solid">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl leading-snug">{label}</span>
              <span className="mt-1 block text-sm leading-5 text-ink-2">{description}</span>
            </span>
            <ArrowUpRight size={18} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" aria-hidden="true" />
          </Link>
        </li>)}
      </ul>
    </nav>
  </div>;
}
