"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Send,
  X,
} from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Field } from "@/components/ui/Field";
import {
  buildFoundPetMessage,
  buildMapsLocationUrl,
  buildWhatsAppHref,
  getLocationErrorKey,
  LOCATION_ERROR_COPY,
  type LocationErrorKey,
} from "@/lib/foundPetReport";
import { copyTextToClipboard } from "@/lib/clipboard";
import { trackFoundPetFlowStarted } from "@/lib/services/telemetry/trackers";

type IdleLocation = { status: "idle" };
type LocatingLocation = { status: "locating" };
type LocatedLocation = { status: "located"; lat: number; lng: number };
type ErrorLocation = { status: "error"; errorKey: LocationErrorKey };

type LocationState =
  | IdleLocation
  | LocatingLocation
  | LocatedLocation
  | ErrorLocation;

type FoundPetPanelProps = {
  petName: string;
  lastZone: string | null;
  whatsappNumber: string;
};

const GEOLOCATION_TIMEOUT_MS = 10000;
const GEOLOCATION_MAXIMUM_AGE_MS = 60_000;

export function FoundPetPanel({
  petName,
  lastZone,
  whatsappNumber,
}: FoundPetPanelProps) {
  const [flowOpen, setFlowOpen] = useState(false);
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const locationUrl =
    location.status === "located"
      ? buildMapsLocationUrl(location.lat, location.lng)
      : "";

  const whatsappHref = buildWhatsAppHref(whatsappNumber, message);

  useEffect(() => {
    if (flowOpen) {
      headingRef.current?.focus();
    }
  }, [flowOpen]);

  function openFlow() {
    // "Flow started" es exactamente este clic: el panel ya está en pantalla
    // antes, así que emitirlo al montar habría medido algo distinto. El evento
    // no lleva el mensaje, ni la ubicación, ni el número de WhatsApp.
    trackFoundPetFlowStarted("started");
    setMessage(buildFoundPetMessage({ petName, lastZone }));
    setLocation({ status: "idle" });
    setFlowOpen(true);
  }

  function closeFlow() {
    setFlowOpen(false);
    setLocation({ status: "idle" });
    setCopied(false);
    setCopyFailed(false);
    setAnnouncement("");
  }

  function handleShareLocation() {
    setLocation({ status: "locating" });
    setAnnouncement("Obteniendo tu ubicación…");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({ status: "error", errorKey: "unavailable" });
      setAnnouncement(LOCATION_ERROR_COPY.unavailable);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = buildMapsLocationUrl(latitude, longitude);
        setLocation({ status: "located", lat: latitude, lng: longitude });
        setMessage(buildFoundPetMessage({ petName, lastZone, locationUrl: url }));
        setAnnouncement("Ubicación obtenida. Revisa el mensaje antes de enviarlo.");
      },
      (error) => {
        const errorKey = getLocationErrorKey(error?.code);
        setLocation({ status: "error", errorKey });
        setAnnouncement(LOCATION_ERROR_COPY[errorKey]);
      },
      { enableHighAccuracy: false, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: GEOLOCATION_MAXIMUM_AGE_MS }
    );
  }

  function handleSkipLocation() {
    setLocation({ status: "idle" });
    setMessage(buildFoundPetMessage({ petName, lastZone }));
    setAnnouncement("Puedes enviar el mensaje sin compartir tu ubicación.");
  }

  async function handleCopyMessage() {
    const ok = await copyTextToClipboard(message);
    if (!ok) {
      setCopyFailed(true);
      setCopied(false);
      setAnnouncement("No se pudo copiar el mensaje. Intenta de nuevo.");
      return;
    }
    setCopied(true);
    setCopyFailed(false);
    setAnnouncement("Mensaje copiado.");
  }

  return (
    <section
      aria-labelledby="encontre-panel-titulo"
      className="rounded-lg border border-l-2 border-danger-rule border-l-danger bg-danger-soft p-5 sm:p-6"
    >
      {!flowOpen ? (
        <div className="grid items-center gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <h2
              id="encontre-panel-titulo"
              className="text-2xl leading-tight text-ink sm:text-[1.75rem]"
            >
              ¿Encontraste a {petName}?
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-ink-2">
              Esta mascota está reportada como perdida. Si la tienes cerca,
              avisa a su familia con un mensaje desde aquí.
            </p>
          </div>
          <button
            type="button"
            onClick={openFlow}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-danger px-5 text-base font-semibold text-on-solid transition-colors hover:brightness-110"
          >
            <Send size={22} aria-hidden="true" />
            Encontré esta mascota
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              ref={headingRef}
              id="encontre-panel-titulo"
              tabIndex={-1}
              className="text-2xl leading-tight text-ink outline-none sm:text-[1.75rem]"
            >
              Avisa que encontraste a {petName}
            </h2>
            <button
              type="button"
              onClick={closeFlow}
              aria-label="Cancelar y volver"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink-2 transition-colors hover:bg-danger-soft hover:text-ink"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {lastZone ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2">
              <MapPin size={16} aria-hidden="true" />
              Última vez visto cerca de: {lastZone}
            </p>
          ) : null}

          <div className="rounded-lg border border-rule bg-surface p-4">
            <p className="text-base font-semibold text-ink">
              Compartir tu ubicación actual
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-2">
              La ubicación es opcional y solo se envía si tú la compartes.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleShareLocation}
                disabled={location.status === "locating"}
                className={[
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-info px-4 text-sm font-semibold text-on-solid transition-colors hover:brightness-110",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
              >
                <MapPin size={20} aria-hidden="true" />
                {location.status === "locating"
                  ? "Obteniendo ubicación…"
                  : location.status === "located"
                    ? "Actualizar ubicación"
                    : "Compartir mi ubicación"}
              </button>

              <button
                type="button"
                onClick={handleSkipLocation}
                disabled={location.status === "locating"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-surface px-4 text-sm font-semibold text-ink-2 ring-1 ring-inset ring-rule-strong transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                Omitir ubicación
              </button>
            </div>

            {location.status === "located" && locationUrl ? (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-success">
                <Check size={16} aria-hidden="true" />
                Ubicación confirmada.
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 rounded-md bg-surface px-2.5 text-sm font-semibold text-success ring-1 ring-inset ring-success-rule transition-colors hover:bg-success-soft"
                >
                  Abrir mapa
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </p>
            ) : null}

            {location.status === "error" ? (
              <p
                role="status"
                className="mt-3 rounded-md bg-warning-soft px-3.5 py-3 text-sm leading-6 text-warning ring-1 ring-inset ring-warning-rule"
              >
                {LOCATION_ERROR_COPY[location.errorKey]}
              </p>
            ) : null}

            {location.status === "locating" ? (
              <p
                role="status"
                className="mt-3 text-sm text-ink-2"
              >
                Obteniendo tu ubicación… Tarda unos segundos.
              </p>
            ) : null}
          </div>

          <Field id="encontre-mensaje" label="Mensaje para la familia">
            {(control) => (
              <textarea
                {...control}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setCopied(false);
                  setCopyFailed(false);
                }}
                rows={4}
                className={`${control.className} resize-y leading-6`}
              />
            )}
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            {whatsappHref ? (
              <ActionButton
                href={whatsappHref}
                label="Enviar por WhatsApp"
                helper="Abre WhatsApp con el mensaje listo"
                icon={Send}
                tone="whatsapp"
                size="large"
              />
            ) : null}
            <button
              type="button"
              onClick={handleCopyMessage}
              className={[
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-base font-semibold transition-colors",
                copied
                  ? "bg-success-soft text-success ring-1 ring-inset ring-success-rule"
                  : "bg-surface text-ink ring-1 ring-inset ring-rule-strong hover:bg-sunken",
              ].join(" ")}
            >
              {copied ? <Check size={22} aria-hidden="true" /> : <Copy size={22} aria-hidden="true" />}
              {copied ? "¡Mensaje copiado!" : "Copiar mensaje"}
            </button>
          </div>

          {copyFailed ? (
            <p role="status" className="text-sm text-danger">
              No se pudo copiar el mensaje. Revisa los permisos del navegador.
            </p>
          ) : null}
        </div>
      )}

      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </section>
  );
}