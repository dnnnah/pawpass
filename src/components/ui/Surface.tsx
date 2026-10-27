import { cx, resolveTone, type ToneName } from "@/lib/ui/tone";

export type SurfaceVariant = "paper" | "sunken" | "outline" | "accent";
export type SurfaceSize = "none" | "sm" | "md" | "lg";

type SurfaceProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** `paper` es el default: una hoja. `sunken` es un hueco. `outline` solo filete. */
  variant?: SurfaceVariant;
  size?: SurfaceSize;
  /** Aplica un filo de color a la izquierda. Reservado para estado/urgencia. */
  tone?: ToneName | string;
  as?: "div" | "section" | "article" | "li" | "aside";
  /**
   * Atributos de accesibilidad reenviados al elemento. Necesarios porque
   * TypeScript no marca como error los atributos JSX con guion
   * (`aria-labelledby`), así que sin esto se perderían en silencio.
   */
  rest?: React.AriaAttributes & { role?: React.AriaRole };
};

const variants: Record<SurfaceVariant, string> = {
  paper: "bg-surface border border-rule shadow-1",
  sunken: "bg-sunken border border-rule",
  outline: "bg-transparent border border-rule",
  accent: "bg-surface border border-rule border-l-2 shadow-1",
};

const sizes: Record<SurfaceSize, string> = {
  none: "",
  sm: "p-3.5 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-4 sm:p-6 lg:p-8",
};

/**
 * Superficie base del sistema. Sustituye a la antigua "glass card":
 * fuera gradientes, desenfoques y radios gigantic; ahora hay hojas, huecos y
 * filetes, que es lo que realmente necesita un documento de identidad.
 */
export function Surface({
  children,
  className,
  id,
  variant = "paper",
  size = "none",
  tone,
  as: Tag = "div",
  rest,
}: SurfaceProps) {
  const toneClasses = tone ? resolveTone(tone) : null;

  return (
    <Tag
      {...rest}
      id={id}
      className={cx(
        "min-w-0 max-w-full rounded-lg",
        variants[variant],
        sizes[size],
        toneClasses?.rule,
        className
      )}
    >
      {children}
    </Tag>
  );
}
