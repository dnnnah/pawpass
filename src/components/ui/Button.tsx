import { cx, resolveTone } from "@/lib/ui/tone";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconEnd?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
};

const base =
  "inline-flex min-w-0 max-w-full items-center justify-center gap-2 rounded-md py-2 text-center font-semibold [overflow-wrap:anywhere] transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none";

const sizes = {
  sm: "min-h-11 px-3 text-sm sm:min-h-9",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

const variants = {
  primary: "bg-brand text-on-solid hover:bg-brand-hover shadow-1",
  // `ring-edge` y no `ring-rule`: el borde de un boton es lo que dice que hay
  // un control pulsable, asi que tiene que llegar a 3:1 (WCAG 1.4.11). Con
  // `ring-rule` a 1.4:1 el boton se disolvia en el papel.
  secondary: "bg-surface text-ink ring-1 ring-inset ring-edge hover:bg-sunken",
  quiet: "bg-transparent text-ink-2 hover:bg-sunken hover:text-ink",
  danger: resolveTone("danger").solid,
};

/** El tamaño compacto conserva 44px táctiles en móvil y 36px desde sm. */
export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  className,
  disabled,
  fullWidth,
  ariaLabel,
}: ButtonProps) {
  const classes = cx(
    base,
    sizes[size],
    variants[variant],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {icon ? (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">{children}</span>
      {iconEnd ? (
        <span aria-hidden="true" className="shrink-0">
          {iconEnd}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
