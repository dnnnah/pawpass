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
  // En tablet el carril arranca plegado en iconos y se despliega al bajar, que
  // es cuando la persona ya esta leyendo y le sirve saber donde esta. En
  // escritorio y en movil el estado no cambia nada: lo decide el CSS.
  const [scrolled, setScrolled] = useState(false);
  const navItems = useMemo(
    () => defaultNavItems.filter((item) => sectionIds ? sectionIds.includes(item.id) : item.id !== "fotos" || hasPhotos),
    [hasPhotos, sectionIds]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 96);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      className={cx(
        "z-40 border-y border-rule bg-canvas/95 backdrop-blur-sm",
        /* En móvil el nav va a sangre: el margen negativo del `px-4` de la pagina
           le devuelve los 32px laterales, y con ellos el ancho que hace falta
           para que los nueve destinos quepan en una sola fila. Desde sm se
           alinea a la columna de contenido, que es el reparto que ya estaba
           aprobado. */
        "-mx-4 px-1 sm:mx-0 sm:px-0",
        "sticky top-0"
      )}
    >
      {/*
        Una sola fila a todo lo ancho, y en móvil reparto por ancho igual: cada
        destino recibe su parte exacta de la fila, sea cual sea el número de
        destinos. Por eso `flex-1` con `min-w-0` en vez de una retícula de
        columnas fijas: con ocho destinos (sin fotos) y con nueve, la fila se
        reparte sola y no hay que calcular ni descentrar una segunda fila que ya
        no existe.

        Qué se gana y qué se paga. Antes, en móvil, cada destino tenía 44px de
        lado: 9x44 son 396px y en un móvil de 390 hay 358px útiles, así que
        cabían solo en dos filas de 5+4, y había que deslizar para ver el último
        destino. Ahora la fila existe siempre y el ancho se reparte: a 320px
        cada destino mide 32px, a 390px son 40px, y a partir de 430px vuelve a
        dar 44px exactos, sin cambiar nada del código. Por debajo de 430px el
        ancho baja de los 44px que recomiendan Apple y Material; cumple el
        mínimo de 24px de WCAG 2.2 (2.5.8) y los 32px medidos dejan 8px entre
        destinos, pero es un intercambio consciente: los 44px de lado frente a
        los nueve destinos en una fila. Lo que no hace falta recortar es el
        alto: 44px en todos los anchos, porque el alto no estira la fila ni le
        quita sitio a los iconos, y el area tactil manda.

        El alto de 36px que habia en movil se recupero como 44px: la fila sigue
        siendo una sola tira de iconos, porque eso lo decide el reparto en
        horizontal, y el nav sigue siendo sticky en movil.

        El icono crece a 18px a partir de 380px, donde el destino ya tiene sitio
        de sobra, y vuelve a 16px desde sm con el resto del menu.

        Las etiquetas se despliegan al bajar, porque ahi es cuando la persona ya
        esta leyendo y le sirve saber donde esta. Entre sm y lg solo se abre la
        del destino activo: las nueve no caben a 768px, y con el resto plegado
        el nombre visible se lee igual. La columna del perfil es de 6xl para
        que, con las nueve etiquetas visibles, el hueco entre destinos sea de
        21px a 1024 y de 37px a partir de 1280, en vez de los 14px que daba la
        columna de 5xl.
      */}
      <ul
        className={cx(
          /* `items-stretch` con `flex-1` en cada `li`: el ancho se reparte por
             igual entre los destinos y el alto lo marca la fila entera, en vez
             de dejar cada boton a su propio ancho con huecos descuadrados. */
          "flex items-stretch gap-1 py-2",
          "sm:justify-between sm:gap-x-3 sm:py-1.5"
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <li key={item.id} className="min-w-0 flex-1 sm:flex-none">
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                aria-current={isActive ? "true" : undefined}
                aria-label={item.label}
                title={item.label}
                className={cx(
                  /* 44px de alto en todos los anchos. Antes eran 36px en movil
                     porque nueve iconos a 52px se leian como una tira de iconos y
                     no como un menu: el ancho es el que obliga a la fila unica,
                     el alto no. Bajarlo a 36 dejaba el area tactil por debajo de
                     los 44px que recomiendan Apple y Material, y el alto del nav
                     sticky no se nota, mientras que el dedo si. */
                  "flex h-11 w-full items-center justify-center gap-1.5 rounded-md px-1 text-[13px] font-medium transition-colors duration-150",
                  "sm:w-auto sm:min-w-11 sm:px-1.5",
                  isActive ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-sunken hover:text-ink"
                )}
              >
                <Icon
                  size={16}
                  className="h-4 w-4 shrink-0 min-[380px]:h-[18px] min-[380px]:w-[18px] sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
                {/* El nombre se pliega con `max-width`, no con `hidden`: asi el
                    despliegue se puede animar. El ancho de la etiqueta no altera
                    el nombre accesible, que sigue viniendo de `aria-label`.

                    Entre sm y lg solo se despliega el destino activo, y siempre:
                    con las nueve etiquetas abiertas a 768px la fila no cabe, y
                    de todos modos saber "donde estoy" no exige leer los otros
                    ocho nombres. El resto se abre al bajar desde lg, que es
                    cuando ya hay ancho de sobra para las nueve. */}
                <span
                  className={cx(
                    "max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 ease-out motion-reduce:transition-none",
                    isActive && "sm:max-w-[10rem] sm:opacity-100",
                    scrolled && "lg:max-w-[10rem] lg:opacity-100",
                    "xl:max-w-[10rem] xl:opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
