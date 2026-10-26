"use client";

import { useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { AlertTriangle, BellRing, Camera, Download, Share2, X } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";
import { cx } from "@/lib/ui/tone";
import { LostPetAlertImage } from "./LostPetAlertImage";
import { formatMexicanDate } from "@/lib/dateFormat";
import { useLostAlerts } from "@/lib/useLostAlerts";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import type { PetProfile } from "@/types/pet";

type LostPetAlertFormProps = {
  pet: PetProfile;
};

export function LostPetAlertForm({ pet }: LostPetAlertFormProps) {
  const alertRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  const [lostZone, setLostZone] = useState(pet.emergencia.zonaPerdida ?? "");
  const [lostDate, setLostDate] = useState(pet.emergencia.fechaPerdida ?? "");
  const [reward, setReward] = useState(pet.emergencia.recompensa?.toString() ?? "");
  const [message, setMessage] = useState(pet.emergencia.mensajeEmergencia ?? "");

  const { alert: lostAlert, activate: activateLostMode, deactivate: deactivateLostMode } = useLostAlerts(pet.id);
  const isLostModeActive = lostAlert?.active === true;

  const profileUrl = getPublicProfileUrl(pet) ?? "";
  const formattedDate = lostDate ? formatMexicanDate(lostDate) ?? lostDate : "";
  const photoUrl = customPhoto ?? pet.mascota.fotoPerfilUrl;

  function handleToggleLostMode() {
    if (isLostModeActive) {
      deactivateLostMode();
      return;
    }
    activateLostMode({
      zonaPerdida: lostZone,
      fechaPerdida: lostDate,
      recompensa: reward ? Number(reward) : null,
      mensaje: message,
    });
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomPhoto(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function captureDataUrl() {
    const element = alertRef.current;
    if (!element) return null;
    return toPng(element, {
      pixelRatio: 3,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const dataUrl = await captureDataUrl();
      if (!dataUrl) return;

      const link = document.createElement("a");
      link.download = `pawpass-alerta-${pet.mascota.nombre.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const element = alertRef.current;
      if (!element) return;

      const blob = await toBlob(element, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      if (!blob) throw new Error("No se pudo generar la imagen para compartir");

      const text = `SE BUSCA: ${pet.mascota.nombre} (${pet.mascota.especie})\n${lostZone ? `Última vez visto: ${lostZone}\n` : ""}${message ? `${message}\n` : ""}Más info: ${profileUrl}`;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `alerta-${pet.mascota.nombre.toLowerCase()}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text });
          return;
        }
      }

      const link = document.createElement("a");
      link.download = `pawpass-alerta-${pet.mascota.nombre.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Surface className="p-6">
        <h3 className="flex items-center gap-2.5 font-display text-xl leading-tight text-ink">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-md bg-warning-soft text-warning"
          >
            <AlertTriangle size={19} />
          </span>
          Personalizar alerta
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-2">
          Modifica los datos antes de generar la imagen. Los campos se pre-rellenan con la
          información existente.
        </p>

        <div className="mt-5 flex items-center gap-4 rounded-md border border-rule bg-sunken p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Foto de la alerta"
            className="size-20 rounded-md bg-sunken object-contain"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Foto de la alerta</p>
            <p className="mt-0.5 text-xs text-ink-2">
              {customPhoto ? "Cargaste una foto nueva" : "Se usa la foto del perfil por defecto"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rule bg-surface px-3 text-xs font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-brand"
              >
                <Camera size={14} aria-hidden="true" />
                Cambiar foto
              </button>
              {customPhoto ? (
                <button
                  type="button"
                  onClick={() => setCustomPhoto(null)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rule bg-surface px-3 text-xs font-semibold text-ink-2 transition-colors hover:border-danger-rule hover:text-danger"
                >
                  <X size={14} aria-hidden="true" />
                  Restaurar foto del perfil
                </button>
              ) : null}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field id="alerta-zona" label="Última vez visto">
            {(control) => (
              <input
                {...control}
                type="text"
                value={lostZone}
                onChange={(e) => setLostZone(e.target.value)}
                placeholder="Ej: Parque de la Condesa"
              />
            )}
          </Field>
          <Field id="alerta-fecha" label="Fecha de pérdida">
            {(control) => (
              <input
                {...control}
                type="date"
                value={lostDate}
                onChange={(e) => setLostDate(e.target.value)}
              />
            )}
          </Field>
          <Field id="alerta-recompensa" label="Recompensa (MXN)">
            {(control) => (
              <input
                {...control}
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="Opcional"
                min="0"
              />
            )}
          </Field>
          <Field id="alerta-telefono" label="Teléfono de contacto">
            {(control) => (
              <input {...control} type="text" value={pet.contacto.telefonoPrincipal} disabled />
            )}
          </Field>
          <Field
            id="alerta-mensaje"
            label="Mensaje de alerta"
            className="sm:col-span-2"
          >
            {(control) => (
              <textarea
                {...control}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ej: Se perdió cerca del parque. Por favor ayúdame a encontrarlo."
                rows={3}
                className={`${control.className} resize-none`}
              />
            )}
          </Field>
        </div>
      </Surface>

      <Surface className="p-6">
        <h3 className="flex items-center gap-2.5 font-display text-xl leading-tight text-ink">
          <span
            aria-hidden="true"
            className={cx(
              "grid size-9 shrink-0 place-items-center rounded-md",
              isLostModeActive ? "bg-danger-soft text-danger" : "bg-sunken text-ink-3"
            )}
          >
            <BellRing size={19} />
          </span>
          Modo alerta en el perfil
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-2">
          Al activarlo, el perfil público de {pet.mascota.nombre} mostrará el banner de mascota
          perdida con los datos que definiste arriba.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-rule bg-sunken p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            {isLostModeActive ? (
              <Pill tone="danger" size="sm" icon={<BellRing size={13} />}>
                Modo alerta activo
              </Pill>
            ) : (
              <Pill tone="muted" size="sm">
                Modo alerta inactivo
              </Pill>
            )}
          </p>
          <button
            type="button"
            onClick={handleToggleLostMode}
            aria-pressed={isLostModeActive}
            className={cx(
              "inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors",
              isLostModeActive
                ? "border border-rule bg-surface text-ink-2 hover:border-brand-rule hover:text-brand"
                : "bg-danger text-on-solid hover:brightness-110"
            )}
          >
            <BellRing size={16} aria-hidden="true" />
            {isLostModeActive ? "Desactivar en el perfil" : "Activar en el perfil"}
          </button>
        </div>
      </Surface>

      <div className="flex flex-col items-center gap-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          Vista previa de la imagen
        </p>

        <div className="w-full max-w-3xl">
          <div ref={alertRef}>
            <LostPetAlertImage
              petName={pet.mascota.nombre}
              species={pet.mascota.especie}
              breed={pet.mascota.raza}
              photoUrl={photoUrl}
              color={pet.mascota.color}
              distinctiveTraits={pet.mascota.rasgosDistintivos}
              lostZone={lostZone}
              lostDate={formattedDate}
              reward={reward ? Number(reward) : null}
              message={message}
              contactPhone={pet.contacto.telefonoPrincipal}
              profileUrl={profileUrl}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-on-solid transition-colors hover:bg-ink-2 disabled:opacity-50"
          >
            <Download size={17} aria-hidden="true" />
            {downloading ? "Generando…" : "Descargar imagen PNG"}
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-brand-rule hover:text-brand disabled:opacity-50"
          >
            <Share2 size={17} aria-hidden="true" />
            {sharing ? "Compartiendo…" : "Compartir"}
          </button>
        </div>
      </div>
    </div>
  );
}
