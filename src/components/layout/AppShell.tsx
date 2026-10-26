import Link from "next/link";
import { PawPrint, Sparkles } from "lucide-react";
import { SiteNav } from "./SiteNav";
import { ThemeToggle } from "./ThemeToggle";
import { InstallCta } from "@/components/pwa/InstallCta";
import { OfflineNavGuard } from "@/components/pwa/OfflineNavGuard";
import { OfflineStatus } from "@/components/pwa/OfflineStatus";

type AppShellProps = {
  children: React.ReactNode;
};

const footerLinks = [
  { href: "/", label: "Inicio" },
  { href: "/mascotas", label: "Mascotas públicas" },
  { href: "/perdidas", label: "Mascotas perdidas" },
  { href: "/adopciones", label: "Adopciones" },
  { href: "/cuenta", label: "Mi cuenta" },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-on-solid"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b border-rule bg-canvas/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-canvas/90">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          <Link
            href="/"
            className="flex min-h-11 min-w-0 items-center gap-2.5"
            aria-label="PawPass, inicio"
          >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-on-solid shadow-sm">
              <PawPrint size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-bold leading-none tracking-tight text-ink">
                PawPass
              </span>
              <span className="mt-0.5 block text-[11px] font-medium leading-none text-ink-3">
                Carnet digital
              </span>
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <SiteNav />
            <ThemeToggle className="rounded-full border border-rule bg-surface hover:border-rule-strong" />
          </div>
        </div>
      </header>

      {/* El estado de conexión va pegado al encabezado, no flotando: es el
          primer sitio donde se mira al levantar el celular, y ocupa su sitio en
          el flujo (no hay layout shift al aparecer ni al desaparecer). Con
          conexión no renderiza nada, así que el shell no cambia. */}
      <OfflineStatus />

      {/* El respiro entre el encabezado global y el contenido es del shell, no de
          cada pagina: nueve contenedores distintos terminaban con `pb-10` y sin
          padding superior, y por eso el enlace "Volver al perfil" de las paginas
          de detalle quedaba pegado al navbar. */}
      <main id="contenido" tabIndex={-1} className="flex-1 pt-8 focus:outline-none sm:pt-10">
        <OfflineNavGuard />
        {children}
      </main>

      <footer className="mt-16 border-t border-rule bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-x-8 gap-y-6 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="max-w-xs">
              <p className="font-display text-lg font-semibold text-ink">PawPass</p>
              <p className="mt-1.5 text-sm leading-6 text-ink-2">
                El carnet digital de tu mascota: identidad, salud y contacto de emergencia en un
                solo lugar.
              </p>
            </div>
            <nav aria-label="Menú del pie" className="min-w-0 sm:justify-self-end">
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-1">
                {footerLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 min-w-0 w-full items-center rounded-md px-2 text-left text-sm font-medium leading-5 text-ink-2 transition-colors hover:bg-sunken hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto sm:justify-end sm:text-right"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {/* El diseño original llevaba una marca de página en la esquina de
                todas las vistas, pero era un trazo punteado dibujado a mano; aquí
                son dos signos nítidos del mismo lenguaje que las marcas de la
                mascota. Vive en el flujo del pie y no como elemento flotante:
                fuera del margen de la columna no habia sitio donde no se montara
                sobre el contenido, y por eso antes solo se veia en pantallas
                muy anchas. En el flujo aparece en todas y no colisiona en
                ninguna. */}
            <div
              aria-hidden="true"
              className="marcas-entran flex shrink-0 items-end justify-self-end gap-2 text-brand opacity-[0.16] print:hidden sm:col-span-2"
            >
              <PawPrint size={30} strokeWidth={1.6} />
              <Sparkles size={16} strokeWidth={1.6} className="mb-1" />
            </div>
          </div>
          <p className="mt-8 border-t border-rule pt-6 text-xs text-ink-3">
            Los perfiles públicos muestran únicamente la información que cada tutor decide
            compartir.
          </p>

          {/* El CTA de instalar vive en el pie a propósito: es una mejora, no una
              urgencia, y arriba competiría con el contenido del carnet. Se
              renderiza solo si el navegador puede instalarlo de verdad y si no
              se descartó antes en este dispositivo. Va sin envoltorio porque
              cuando se oculta no debe quedar ni un margen vacío. */}
          <InstallCta />
        </div>
      </footer>
    </div>
  );
}
