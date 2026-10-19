import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/ui/tone";

type ActionButtonProps = {
  href: string;
  label: string;
  helper?: string;
  icon: LucideIcon;
  tone?: "call" | "whatsapp" | "location" | "urgentCall" | "urgentWhatsapp";
  size?: "normal" | "large";
  className?: string;
  /**
   * Observador del clic. Lo consume la telemetría para registrar la acción
   * (FASE 8B). No cambia el destino ni el comportamiento del enlace: solo
   * observa. Se mantiene opcional para no obligar a todos los usos a definirlo.
   */
  onActivate?: () => void;
};

/**
 * Acción de contacto. Es el elemento de mayor peso en un perfil de mascota,
 * así que va sólido, con icono + texto y una jerarquía clara: la acción
 * urgente gana contraste; el resto baja a secundario.
 */
const tones = {
  // El helper de `call` es el telefono: es el dato que la persona necesita, no
  // una nota, asi que va a 600. En los demas es un texto de apoyo y se queda en
  // 500. El tamano vive en la base (15px) y el peso en el tono, para que dos
  // clases del mismo peso no peleeen por la cascada.
  call: {
    card: "bg-surface border-edge hover:border-brand-rule hover:bg-brand-soft",
    icon: "bg-brand text-on-solid",
    label: "text-ink",
    helper: "text-ink-2 font-semibold",
  },
  whatsapp: {
    card: "bg-surface border-edge hover:border-success-rule hover:bg-success-soft",
    icon: "bg-success text-on-solid",
    label: "text-ink",
    helper: "text-ink-2 font-medium",
  },
  location: {
    card: "bg-surface border-edge hover:border-info-rule hover:bg-info-soft",
    icon: "bg-info text-on-solid",
    label: "text-ink",
    helper: "text-ink-2 font-medium",
  },
  urgentCall: {
    card: "bg-danger-soft border-danger-rule hover:border-danger hover:bg-danger",
    // En hover el fondo pasa a sólido, así que el texto se invierte a
    // `--on-solid`, que ya cambia con el tema: `#ffffff` sobre el rojo
    // `#8f2b23` en claro y `#14110f` sobre el rosa `#e08a80` en oscuro. Con
    // `text-ink` fijo quedaba casi negro sobre rojo en claro y casi blanco
    // sobre rosa en oscuro: ilegible en los dos temas. El chip pasa a
    // `--on-solid` al 25% porque si no se fundía con la tarjeta, que ya es
    // del mismo tono.
    // `group-hover:` y no `hover:`. CSS hace `:hover` en el elemento bajo el
    // puntero y sus ancestros, nunca en sus descendientes: con `hover:` el
    // texto solo se invertia si el puntero caia justo sobre el glifo, y el
    // chip, el padding y el hueco entre lineas quedaban con el color viejo.
    // El chip ya usaba `group-hover:`; la etiqueta y el helper ahora igual.
    icon: "bg-danger text-on-solid group-hover:bg-on-solid/25",
    label: "text-ink group-hover:text-on-solid",
    helper: "text-ink-2 font-semibold group-hover:text-on-solid/85",
  },
  urgentWhatsapp: {
    // Mismo razonamiento que `urgentCall`: el fondo tiene que volverse solido en
    // hover, porque el texto se invierte a `--on-solid`. Sin `hover:bg-success`
    // el texto blanco caia sobre el verde palido de `success-soft` (1.2:1).
    card: "bg-success-soft border-success-rule hover:border-success hover:bg-success",
    icon: "bg-success text-on-solid group-hover:bg-on-solid/25",
    label: "text-ink group-hover:text-on-solid",
    helper: "text-ink-2 font-medium group-hover:text-on-solid/85",
  },
} as const;

export function ActionButton({
  href,
  label,
  helper,
  icon: Icon,
  size = "normal",
  tone = "call",
  className,
  onActivate,
}: ActionButtonProps) {
  const classes = tones[tone];
  const urgent = tone === "urgentCall" || tone === "urgentWhatsapp";

  return (
    <a
      href={href}
      onClick={onActivate}
      className={cx(
        "group flex w-full min-w-0 items-center gap-3.5 rounded-lg border px-4 py-3.5 transition-colors duration-150",
        size === "large" && "sm:px-5 sm:py-4",
        classes.card,
        className
      )}
    >
      <span
        className={cx(
          "grid shrink-0 place-items-center rounded-md",
          size === "large" ? "h-11 w-11" : "h-10 w-10",
          classes.icon
        )}
      >
        <Icon size={size === "large" ? 22 : 20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            "block font-semibold leading-snug [overflow-wrap:anywhere]",
            size === "large" ? "text-lg" : "text-base",
            classes.label
          )}
        >
          {label}
        </span>
        {helper ? (
          <span
            className={cx(
              "mt-0.5 block text-[0.9375rem] leading-snug [overflow-wrap:anywhere]",
              classes.helper
            )}
          >
            {helper}
          </span>
        ) : null}
      </span>
      {urgent ? (
        <span className="sr-only">Acción urgente</span>
      ) : null}
    </a>
  );
}
