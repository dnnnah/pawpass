"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  ClipboardList,
  FileText,
  Heart,
  IdCard,
  PawPrint,
  Phone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { cx } from "@/lib/ui/tone";

type NavItem = {
  id: string;
  label: string;
  icon: typeof Heart;
};

const defaultNavItems: NavItem[] = [
  { id: "contacto", label: "Contacto", icon: Phone },
  { id: "info", label: "Información", icon: PawPrint },
  { id: "salud", label: "Salud", icon: Heart },
  { id: "veterinario", label: "Veterinario", icon: Stethoscope },
  { id: "fotos", label: "Fotos", icon: Camera },
  { id: "vacunas", label: "Vacunas", icon: ShieldCheck },
  { id: "expediente", label: "Expediente", icon: ClipboardList },
  { id: "carnet", label: "Carnet", icon: IdCard },
  { id: "documentos", label: "Documentos", icon: FileText },
];

type ProfileNavProps = {
  hasPhotos?: boolean;
  /** Restricts the navigation to sections present in this profile view. */
  sectionIds?: readonly string[];
};


export function ProfileNav({ hasPhotos = true, sectionIds }: ProfileNavProps) {
  // Arranca marcada la primera sección en vez de `""`: sin sección activa el
  // nav queda sin ningun estado visible hasta que el observador de interseccion
  // registra la primera, que ocurre tras el primer scroll.
  const [active, setActive] = useState(sectionIds?.[0] ?? defaultNavItems[0].id);
  const navItems = useMemo(
    () => defaultNavItems.filter((item) => sectionIds ? sectionIds.includes(item.id) : item.id !== "fotos" || hasPhotos),
    [hasPhotos, sectionIds]
  );

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [navItems]);

  function scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <nav
      aria-label="Secciones del perfil"
      className="sticky top-[var(--app-header-height)] z-30 -mx-4 min-w-0 border-y border-rule bg-canvas/95 px-4 backdrop-blur-sm sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-0 gap-1 overflow-x-auto overscroll-x-contain py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                aria-current={isActive ? "true" : undefined}
                className={cx(
                  "flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors",
                  isActive ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-sunken hover:text-ink"
                )}
              >
                <Icon size={16} className="shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
