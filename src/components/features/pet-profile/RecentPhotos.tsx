"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isOpen = selectedIndex !== null;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

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
      if (event.key === "Tab") {
        const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, move]);

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

        {photos.length === 0 ? (
          <p className="mt-4 rounded-md bg-sunken px-4 py-3 text-sm leading-5 text-ink-2">
            Aún no hay fotos compartidas.
          </p>
        ) : null}

        {profilePhoto && photos.length > 0 ? (
          <div className="mt-5 flex items-center gap-3">
            <Image
              src={profilePhoto}
              alt="Foto de perfil de la mascota"
              width={80}
              height={80}
              loading="lazy"
              unoptimized
              className="size-16 shrink-0 rounded-md object-cover ring-1 ring-rule sm:size-20"
            />
            <p className="text-sm text-ink-2">
              <span className="font-medium text-ink">Perfil</span> · foto principal
            </p>
          </div>
        ) : null}

        {photos.length > 0 ? <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:gap-3">
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
                sizes="(min-width: 1024px) 12vw, (min-width: 640px) 20vw, 30vw"
                loading="lazy"
                unoptimized
                onError={() => handleImageError(photo.id)}
                className="size-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-ink/40 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand size={20} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div> : null}
      </Surface>

      <AnimatePresence>
        {selected && selectedIndex !== null ? (
          <motion.div
            ref={dialogRef}
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/80 p-3 sm:p-6"
            onClick={() => setSelectedIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Foto: ${selected.name}`}
          >
            <motion.div
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex max-h-[calc(100dvh-1.5rem)] min-w-0 w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-surface ring-1 ring-rule sm:max-h-[calc(100dvh-3rem)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rule p-2">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => move(-1)} disabled={photos.length < 2} aria-label="Foto anterior" className="grid size-11 place-items-center rounded-md text-ink hover:bg-sunken disabled:opacity-40"><ChevronLeft size={22} aria-hidden="true" /></button>
                  <button type="button" onClick={() => move(1)} disabled={photos.length < 2} aria-label="Foto siguiente" className="grid size-11 place-items-center rounded-md text-ink hover:bg-sunken disabled:opacity-40"><ChevronRight size={22} aria-hidden="true" /></button>
                  <span className="text-sm text-ink-2">{selectedIndex + 1} / {photos.length}</span>
                </div>
                <button ref={closeRef} type="button" onClick={() => setSelectedIndex(null)} aria-label="Cerrar" className="grid size-11 shrink-0 place-items-center rounded-md text-ink hover:bg-sunken"><X size={22} aria-hidden="true" /></button>
              </div>
              <div className="relative min-h-0 shrink-0 overflow-hidden bg-sunken">
                <Image
                  src={failedPhotos.has(selected.id) && profilePhoto ? profilePhoto : selected.url}
                  alt={selected.name}
                  width={900}
                  height={900}
                  sizes="(max-width: 768px) 100vw, 672px"
                  loading="eager"
                  unoptimized
                  className="max-h-[min(60dvh,max(4rem,calc(100dvh-14rem)))] w-full object-contain"
                />
              </div>
              <div className="min-h-0 shrink overflow-y-auto p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg leading-snug text-ink">{selected.name}</p>
                    <p className="mt-1 text-sm text-ink-2">{selected.date}</p>
                  </div>
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
