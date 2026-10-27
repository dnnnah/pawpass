"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, QrCode, Search, X } from "lucide-react";
import { normalizePublicProfileCode, resolvePublicProfileCode } from "@/lib/publicProfileUrl";

type Detection = { rawValue: string };
type Detector = { detect(source: HTMLVideoElement): Promise<Detection[]> };
type DetectorConstructor = new (options?: { formats?: string[] }) => Detector;

const cameraCopy = {
  denied: "No se concedió permiso a la cámara. Puedes escribir el código o pegar el enlace de PawPass.",
  unavailable: "No hay una cámara o lector QR disponible en este navegador. Puedes escribir el código o pegar el enlace de PawPass.",
  invalid: "El QR no contiene un código o enlace válido de PawPass. Puedes escribirlo manualmente.",
} as const;

export function PublicCodeAccess() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraMessage, setCameraMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  useEffect(() => {
    if (!scannerOpen || !streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    const DetectorApi = (window as Window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!DetectorApi) return;
    const detector = new DetectorApi({ formats: ["qr_code"] });
    let active = true;
    let timeout = 0;
    const scan = async () => {
      const video = videoRef.current;
      if (!active || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        timeout = window.setTimeout(scan, 200);
        return;
      }
      try {
        const [result] = await detector.detect(video);
        if (result) {
          const code = resolvePublicProfileCode(result.rawValue, window.location.origin);
          if (code) {
            setValue(code);
            router.push(`/p/${encodeURIComponent(code)}`);
            return;
          }
          setCameraMessage(cameraCopy.invalid);
        }
      } catch {
        setCameraMessage(cameraCopy.unavailable);
        stopScanner();
        return;
      }
      if (active) timeout = window.setTimeout(scan, 250);
    };
    void videoRef.current.play().then(scan).catch(() => {
      setCameraMessage(cameraCopy.unavailable);
      stopScanner();
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
    // Scanner setup intentionally runs once per camera session.
  }, [scannerOpen, router]);

  function stopScanner() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScannerOpen(false);
  }

  async function startScanner() {
    setCameraMessage("");
    const detector = (window as Window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!detector || !navigator.mediaDevices?.getUserMedia) {
      setCameraMessage(cameraCopy.unavailable);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScannerOpen(true);
    } catch (error) {
      setCameraMessage(error instanceof DOMException && error.name === "NotAllowedError" ? cameraCopy.denied : cameraCopy.unavailable);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = resolvePublicProfileCode(value, window.location.origin) ?? normalizePublicProfileCode(value);
    if (!code) {
      setCameraMessage("Escribe un código con formato PC-NOMBRE-001 o pega un enlace QR de PawPass.");
      return;
    }
    router.push(`/p/${encodeURIComponent(code)}`);
  }

  return (
    <section aria-labelledby="buscar-ficha-titulo" className="rounded-lg border border-rule bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"><QrCode size={20} /></span>
        <div className="min-w-0">
          <h2 id="buscar-ficha-titulo" className="font-display text-xl leading-snug text-ink">Abrir una ficha QR</h2>
          <p className="mt-1 text-sm leading-6 text-ink-2">Escribe el código público o escanea el QR de una mascota. No necesitas iniciar sesión.</p>
        </div>
      </div>

      <form className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="codigo-publico">Código o enlace PawPass</label>
        <input
          id="codigo-publico"
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          onChange={(event) => setValue(event.target.value)}
          placeholder="PC-LUCCA-001 o pega el enlace"
          value={value}
          className="min-h-12 min-w-0 rounded-md border border-edge bg-surface px-3 text-base text-ink placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand px-4 font-semibold text-on-solid hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <Search size={18} aria-hidden="true" /> Buscar ficha
        </button>
      </form>

      <div className="mt-3">
        {!scannerOpen ? (
          <button type="button" onClick={startScanner} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <Camera size={17} aria-hidden="true" /> Abrir cámara para escanear QR
          </button>
        ) : (
          <div className="space-y-3">
            <video ref={videoRef} aria-label="Cámara para escanear el QR de PawPass" autoPlay playsInline muted className="max-h-64 w-full rounded-md bg-sunken object-cover" />
            <button type="button" onClick={stopScanner} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-2 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><X size={17} aria-hidden="true" /> Cerrar cámara</button>
          </div>
        )}
      </div>
      {cameraMessage ? <p role="status" className="mt-2 text-sm leading-6 text-warning">{cameraMessage}</p> : null}
    </section>
  );
}
