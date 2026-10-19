import { getDocumentCategoryMeta } from "@/lib/mapping/documentCategory";
import { cx } from "@/lib/ui/tone";
import type { PetDocument, PetDocumentType } from "@/types/pet";

type DocumentPreviewProps = {
  document: PetDocument;
  size?: "sm" | "md";
};

const typeLabel: Record<PetDocumentType, string> = {
  pdf: "PDF",
  imagen: "IMG",
  otro: "Archivo",
};

export function DocumentPreview({ document, size = "md" }: DocumentPreviewProps) {
  const category = getDocumentCategoryMeta(document.categoria);
  const Icon = category.icon;
  const isImage = document.tipo === "imagen";
  const iconSize = size === "sm" ? 18 : 22;
  const boxSize = size === "sm" ? "size-10" : "size-14";
  const label = typeLabel[document.tipo];

  return (
    <div className="flex items-center gap-3">
      <span className="relative shrink-0">
        {isImage ? (
          <span className={cx("block overflow-hidden rounded-md", boxSize)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={document.url}
              alt=""
              className="size-full object-cover"
            />
          </span>
        ) : (
          <span
            className={cx(
              "grid place-items-center rounded-md bg-sunken text-ink-2",
              boxSize
            )}
          >
            <Icon size={iconSize} aria-hidden="true" />
          </span>
        )}
        <span className="absolute -bottom-1 -right-1 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-2 ring-1 ring-rule">
          {label}
        </span>
      </span>
    </div>
  );
}
