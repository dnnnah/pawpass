"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bone, HeartHandshake, LogIn, PawPrint, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/infra/supabase/client";
import { hasSupabaseEnv } from "@/lib/infra/supabase/env";

const baseLinks = [
  { href: "/", label: "Inicio", icon: PawPrint, match: (p: string) => p === "/" },
  {
    href: "/#mascotas",
    label: "Mascotas",
    icon: Bone,
    match: (p: string) => p.startsWith("/perfil"),
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

  const links = [
    ...baseLinks,
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
      className="order-last -mx-4 w-[calc(100%+2rem)] px-4 sm:order-none sm:mx-0 sm:w-auto sm:px-0"
    >
      <ul className="flex flex-wrap items-center gap-0.5 border-t border-rule pt-2 sm:border-0 sm:pt-0">
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname ?? "");

          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold transition-colors duration-150 sm:px-3",
                  active
                    ? "bg-brand-soft text-brand-ink"
                    : "text-ink-2 hover:bg-sunken hover:text-ink",
                ].join(" ")}
              >
                <Icon size={16} aria-hidden="true" className="shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
