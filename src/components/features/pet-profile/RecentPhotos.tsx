"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";

type Photo = {
  id: string;
  name: string;
  url: string;
  date: string;
  description?: string;
};

type RecentPhotosProps = {
  photos: ReadonlyArray<Photo>;
  profilePhoto: string | null;
};

export function RecentPhotos({ photos, profilePhoto }: RecentPhotosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<ReadonlySet<string>>(new Set());

  const selected =
    selectedIndex !== null ? photos[selectedIndex] : null;

  const handleImageError = useCallback((photoId: string) => {
    setFailedPhotos((current) => {
      if (current.has(photoId)) return current;
      const next = new Set(current);
      next.add(photoId);
      return next;
    });
  }, []);

  const move = useCallback(
    (offset: number) => {
      setSelectedIndex((current) => {
        if (current === null) return current;
        return (current + offset + photos.length) % photos.length;
      });
    },
    [photos.length]
  );

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, move]);

  if (photos.length === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      <Surface className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 font-display text-xl leading-tight text-ink">
            <Camera size={19} aria-hidden="true" className="shrink-0 text-ink-3" />
            Fotos recientes
          </h2>
          <Pill tone="muted" size="sm">
            {photos.length}
          </Pill>
        </div>

        {profilePhoto ? (
          <div className="mt-5 flex items-center gap-3">
            <Image
              src={profilePhoto}
              alt="Foto de perfil de la mascota"
              width={80}
              height={80}
              unoptimized
              className="size-16 shrink-0 rounded-md object-cover ring-1 ring-rule sm:size-20"
            />
            <p className="text-sm text-ink-2">
              <span className="font-medium text-ink">Perfil</span> · foto principal
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:gap-3">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Ver foto: ${photo.name}`}
              className="group relative aspect-square overflow-hidden rounded-md ring-1 ring-rule transition-colors hover:ring-brand-rule"
            >
              <Image
                src={failedPhotos.has(photo.id) && profilePhoto ? profilePhoto : photo.url}
                alt={photo.name}
                width={400}
                height={400}
                unoptimized
                onError={() => handleImageError(photo.id)}
                className="size-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-ink/40 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand size={20} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </Surface>

      <AnimatePresence>
        {selected && selectedIndex !== null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
            onClick={() => setSelectedIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Foto: ${selected.name}`}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-md bg-surface text-ink transition-colors hover:bg-canvas"
            >
              <X size={22} aria-hidden="true" />
            </button>

            <button
              onClick={(event) => {
                event.stopPropagation();
                move(-1);
              }}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-md bg-surface text-ink transition-colors hover:bg-canvas"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                move(1);
              }}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-md bg-surface text-ink transition-colors hover:bg-canvas"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>

            <motion.div
              key={selected.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-lg bg-surface ring-1 ring-rule"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative max-h-[60vh] overflow-hidden bg-sunken">
                <Image
                  src={failedPhotos.has(selected.id) && profilePhoto ? profilePhoto : selected.url}
                  alt={selected.name}
                  width={900}
                  height={900}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg leading-snug text-ink">{selected.name}</p>
                    <p className="mt-1 text-sm text-ink-2">{selected.date}</p>
                  </div>
                  <Pill tone="muted" size="sm">
                    {selectedIndex + 1} / {photos.length}
                  </Pill>
                </div>
                {selected.description ? (
                  <p className="mt-2.5 text-sm leading-6 text-ink-2">{selected.description}</p>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}
