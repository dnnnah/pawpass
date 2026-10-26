import Link from "next/link";
import { ChevronRight, Download, Folder } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { DocumentPreview } from "./DocumentPreview";
import { getDocumentCategoryLabel, getDocumentMeta } from "@/lib/petDocuments";
import type { PetDocument } from "@/types/pet";

type DocumentsCardProps = {
  documents: ReadonlyArray<PetDocument>;
  documentsPath: string;
  showAllLink?: boolean;
};

export function DocumentsCard({ documents, documentsPath, showAllLink = true }: DocumentsCardProps) {
  return (
    // `@container` + consultas de contenedor en vez de `md:`/`lg:`: esta tarjeta
    // se usa en una columna estrecha del perfil (488px a 1280px de ventana) y en
    // una tarjeta a pantalla completa. Los breakpoints de ventana le imponían
    // tres columnas de 155px, donde el nombre, la categoria y el boton de
    // descarga no cabian. Ahora las columnas dependen del ancho de la tarjeta.
    <Surface className="@container p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2.5 font-display text-xl leading-tight text-ink">
          <Folder size={20} className="shrink-0 text-ink-3" aria-hidden="true" />
          Documentos
        </h2>
        {showAllLink ? (
          <Link
            href={documentsPath}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
          >
            Ver todos
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {documents.length > 0 ? (
        <ul className="mt-5 grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-3">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-rule bg-sunken p-3"
            >
              <a
                href={document.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <DocumentPreview document={document} size="sm" />
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium leading-5 text-ink">
                    {document.nombre}
                  </span>
                  <span className="mt-0.5 block break-words text-xs text-ink-2">
                    {getDocumentMeta(document)}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                    {getDocumentCategoryLabel(document.categoria)}
                  </span>
                </span>
              </a>
              <a
                href={document.url}
                download
                className="grid size-11 shrink-0 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface hover:text-brand"
                aria-label={`Descargar ${document.nombre}`}
              >
                <Download size={17} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-rule-strong p-6 text-center">
          <Folder size={24} className="mx-auto text-ink-3" aria-hidden="true" />
          <p className="mt-3 font-display text-lg text-ink">Sin documentos públicos</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-2">
            La familia no tiene documentos visibles para este perfil.
          </p>
        </div>
      )}
    </Surface>
  );
}
