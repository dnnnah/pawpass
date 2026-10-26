"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Bone, HeartHandshake, LogIn, Menu, PawPrint, UserRound, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

const baseLinks = [
  { href: "/", label: "Inicio", icon: PawPrint, match: (p: string) => p === "/" },
  {
    href: "/perdidas",
    label: "Mascotas perdidas",
    icon: AlertTriangle,
    match: (p: string) => p.startsWith("/perdidas"),
  },
  {
    href: "/mascotas",
    label: "Mascotas públicas",
    icon: Bone,
    match: (p: string) => p === "/mascotas" || p.startsWith("/mascotas/") || p.startsWith("/perfil/"),
  },
  {
    href: "/adopciones",
    label: "Adopciones",
    icon: HeartHandshake,
    match: (p: string) => p.startsWith("/adopciones") || p.startsWith("/refugios"),
  },
];

export function SiteNav() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [menuOpenForPath, setMenuOpenForPath] = useState<string | null>(null);
  const menuOpen = menuOpenForPath !== null && menuOpenForPath === pathname;

  useEffect(() => {
    if (!hasSupabaseEnv()) return;

    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setAuthenticated(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpenForPath(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const links = [
    ...baseLinks.slice(0, 1),
    ...(authenticated ? [{ href: "/mis-mascotas", label: "Mis mascotas", icon: Bone, match: (p: string) => p.startsWith("/mis-mascotas") || p.startsWith("/cuenta/mascotas/") }] : []),
    ...baseLinks.slice(1),
    {
      href: authenticated ? "/cuenta" : "/login",
      label: authenticated ? "Mi cuenta" : "Iniciar sesión",
      icon: authenticated ? UserRound : LogIn,
      match: (p: string) => (authenticated ? p.startsWith("/cuenta") : p === "/login"),
    },
  ];

  return (
    <nav
      aria-label="Menú principal"
      className="relative lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2"
    >
      <button
        type="button"
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        aria-controls="menu-principal-movil"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpenForPath(menuOpen ? null : (pathname ?? "/"))}
        className="grid h-11 w-11 place-items-center rounded-xl border border-rule bg-surface text-ink transition-colors hover:border-rule-strong hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
      >
        {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      <ul className="hidden items-center gap-1 rounded-full border border-rule bg-surface p-1 shadow-sm lg:flex">
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname ?? "");

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand xl:px-4",
                  active ? "bg-brand text-on-solid shadow-sm" : "text-ink-2 hover:bg-sunken hover:text-ink",
                ].join(" ")}
              >
                <Icon size={16} aria-hidden="true" className="shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <ul
        id="menu-principal-movil"
        className={`${menuOpen ? "grid" : "hidden"} absolute -right-[3.25rem] top-[calc(100%+0.75rem)] z-50 max-h-[calc(100dvh-6rem)] w-[min(20rem,calc(100vw-2rem))] gap-1 overflow-y-auto rounded-2xl border border-rule bg-surface p-2 shadow-xl lg:hidden`}
      >
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname ?? "");

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpenForPath(null)}
                className={[
                  "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active ? "bg-brand text-on-solid" : "text-ink-2 hover:bg-sunken hover:text-ink",
                ].join(" ")}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
