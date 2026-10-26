type SubpageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Metadatos cortos bajo la descripción (id, fecha, estado). */
  meta?: React.ReactNode;
  action?: React.ReactNode;
};

/**
 * Cabecera de página. En el sistema nuevo es un *masthead* editorial:
 * sobrelínea, titular en serif, bajada y filete. Sin caja, sin gradiente,
 * sin icono gigante de 96px pegado a la esquina.
 */
export function SubpageHeader({
  eyebrow,
  title,
  description,
  meta,
  action,
}: SubpageHeaderProps) {
  return (
    <header className="border-b border-rule pb-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          {eyebrow ? <p className="overline mb-2.5 text-brand">{eyebrow}</p> : null}
          <h1 className="text-[2rem] leading-[1.1] text-ink [overflow-wrap:anywhere] sm:text-[2.5rem]">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-2">{description}</p>
          ) : null}
          {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {action ? <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}
