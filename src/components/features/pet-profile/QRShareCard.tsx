"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Download, FileCode2, Link2, Printer, QrCode, TriangleAlert } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Surface } from "@/components/ui/Surface";
import { trackQrGenerated } from "@/lib/services/telemetry/trackers";
import { cx } from "@/lib/ui/tone";

const QR_EXPORT_SIZE = 1024;
const QR_PRINT_SIZE = 2048;
const QR_PRINT_MARGIN = 256;

type QRShareCardProps = {
  petName: string;
  profileUrl: string;
  petCode: string;
  className?: string;
};

type BusyAction = "png" | "svg" | null;
type CopyKind = "url" | "id" | null;

const subscribeToNothing = () => () => {};

function cleanQrSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(QR_EXPORT_SIZE));
  clone.setAttribute("height", String(QR_EXPORT_SIZE));
  clone.removeAttribute("style");
  return new XMLSerializer().serializeToString(clone);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function QRShareCard({ petName, profileUrl, petCode, className }: QRShareCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [copied, setCopied] = useState<CopyKind>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const shareUrl = useSyncExternalStore(
    subscribeToNothing,
    () => /^https?:\/\//i.test(profileUrl)
      ? profileUrl
      : profileUrl.startsWith("/")
        ? new URL(profileUrl, window.location.origin).toString()
        : "",
    () => /^https?:\/\//i.test(profileUrl) ? profileUrl : ""
  );

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const announce = useCallback(
    (message: string) => {
      setLiveMessage(message);
      later(() => setLiveMessage(""), 3200);
    },
    [later]
  );

  const fileName = petName.toLowerCase().replace(/\s+/g, "-");

  const handleCopy = useCallback(
    async (kind: "url" | "id") => {
      const target = kind === "url" ? shareUrl : petCode;
      const ok = await copyText(target);
      setCopied(kind);
      later(() => setCopied(null), 1800);
      announce(
        ok
          ? kind === "url"
            ? "URL del perfil copiada"
            : "ID PawPass copiado"
          : "No se pudo copiar. Revisa los permisos del navegador."
      );
      if (!ok) {
        setCopyFailed(true);
        later(() => setCopyFailed(false), 3000);
      }
    },
    [shareUrl, petCode, announce, later]
  );

  const handleDownloadPng = useCallback(async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || busy) return;
    setBusy("png");
    setDownloadFailed(false);
    try {
      const svgText = cleanQrSvg(svg);
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se pudo cargar el QR"));
      });
      img.src = url;

      await loaded;

      const canvas = document.createElement("canvas");
      canvas.width = QR_PRINT_SIZE;
      canvas.height = QR_PRINT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas no disponible");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const contentSize = QR_PRINT_SIZE - QR_PRINT_MARGIN * 2;
      ctx.drawImage(img, QR_PRINT_MARGIN, QR_PRINT_MARGIN, contentSize, contentSize);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `pawpass-qr-${fileName}.png`;
      link.click();

      // El PNG ya salió del navegador: el QR se produjo. Solo aquí, y nunca en
      // el `catch`: si falla el render o la conversión, no se generó nada.
      // (La descarga en sí no se puede confirmar desde aquí; el navegador no
      // avisa. Por eso `qr_generated` cuenta "exporté", no "lo guardaste".)
      trackQrGenerated("profile");

      announce("QR descargado en PNG de alta resolución");
    } catch {
      setDownloadFailed(true);
      later(() => setDownloadFailed(false), 3000);
      announce("No se pudo descargar el QR en PNG");
    } finally {
      setBusy(null);
    }
  }, [fileName, busy, announce, later]);

  const handleDownloadSvg = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || busy) return;
    setBusy("svg");
    setDownloadFailed(false);
    try {
      downloadBlob(
        new Blob([cleanQrSvg(svg)], { type: "image/svg+xml;charset=utf-8" }),
        `pawpass-qr-${fileName}.svg`
      );
      trackQrGenerated("profile");
      announce("QR exportado en SVG");
    } catch {
      setDownloadFailed(true);
      later(() => setDownloadFailed(false), 3000);
      announce("No se pudo exportar el QR en SVG");
    } finally {
      setBusy(null);
    }
  }, [fileName, busy, announce, later]);

  const buttonClasses = [
    "inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold",
    "border border-edge bg-surface text-ink-2 transition-colors hover:border-brand-rule hover:text-brand",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");

  return (
    <Surface className={cx("@container p-4 sm:p-5", className)}>
      {/* `min-w-0` en cada nivel: sin esto la URL larga y la rejilla de
          botones ensanchan la tarjeta y descuadran la columna de documentos. */}
      <div className="grid min-w-0 grid-cols-1 gap-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"
          >
            <QrCode size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg leading-snug text-ink [overflow-wrap:anywhere]">
              Comparte el QR de {petName}
            </h2>
            <p className="mt-1 text-sm text-ink-2">Quien lo escanee verá datos básicos para ayudar a que vuelva a casa. El carnet sigue privado.</p>
          </div>
        </div>

        {!shareUrl ? (
          <div className="rounded-md border border-dashed border-rule-strong p-4">
            <p className="text-sm font-medium text-ink">QR no disponible</p>
            <p className="mt-1 text-sm text-ink-2">
              Este perfil aún no tiene un identificador público asignado.
            </p>
          </div>
        ) : (
          <>
            <div className="mx-auto flex min-w-0 w-full max-w-64 flex-col items-center">
              <div
                ref={qrRef}
                className="grid size-44 shrink-0 place-items-center rounded-md bg-white p-2 ring-1 ring-rule sm:size-48"
              >
                <QRCodeSVG
                  value={shareUrl}
                  size={QR_EXPORT_SIZE}
                  marginSize={4}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#111827"
                  role="img"
                  aria-label={`Código QR del perfil público de ${petName}`}
                  title={`Código QR del perfil público de ${petName}`}
                  style={{ width: "100%", height: "100%" }}
                />
                {/* Pintar el QR no es generarlo: este bloque se dibuja en cada
                    render y en cada visita. `qr_generated` solo se emite en las
                    dos descargas de abajo, que son las que producen un archivo. */}
              </div>
              {/* La URL y el identificador quedan limitados por el ancho de la tarjeta. */}
              <p className="mt-2 flex min-w-0 w-full items-center justify-center gap-1 text-xs text-ink-3">
                <Link2 size={12} aria-hidden="true" className="shrink-0" />
                <span className="min-w-0 truncate [overflow-wrap:anywhere]">{shareUrl}</span>
              </p>
              <p className="mt-1 min-w-0 w-full text-center text-xs text-ink-2 [overflow-wrap:anywhere]">ID PawPass: {petCode}</p>
              <Link href={shareUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 min-w-0 max-w-full items-center justify-center rounded-md px-3 text-center text-sm font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                Abrir ficha QR como visitante
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-2 @min-[16rem]:grid-cols-2 [&>*]:min-w-0 [&>button>svg]:shrink-0">
              <button
                type="button"
                onClick={() => handleCopy("url")}
                disabled={busy !== null}
                aria-label="Copiar la URL del perfil para compartir"
                className={buttonClasses}
              >
                {copied === "url" ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
                <span className="truncate">{copied === "url" ? "¡Copiado!" : "Copiar URL"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy("id")}
                disabled={busy !== null}
                aria-label="Copiar el ID PawPass"
                className={buttonClasses}
              >
                {copied === "id" ? <Check size={16} aria-hidden="true" /> : <BadgeCheck size={16} aria-hidden="true" />}
                <span className="truncate">{copied === "id" ? "¡Copiado!" : "Copiar ID"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={busy !== null}
                aria-label="Descargar el QR en PNG de alta resolución para imprimir"
                className={buttonClasses}
              >
                <Download size={16} aria-hidden="true" />
                <span className="truncate">{busy === "png" ? "Generando…" : "Descargar PNG"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSvg}
                disabled={busy !== null}
                aria-label="Exportar el QR en formato vectorial SVG"
                className={buttonClasses}
              >
                <FileCode2 size={16} aria-hidden="true" />
                <span className="truncate">{busy === "svg" ? "Generando…" : "Exportar SVG"}</span>
              </button>
            </div>

            <details className="group min-w-0 rounded-md border border-rule">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-3 text-sm font-semibold text-ink-2">
                <Printer size={16} aria-hidden="true" className="shrink-0 text-ink-3" />
                Cómo imprimir o usar el QR
                <TriangleAlert
                  size={14}
                  aria-hidden="true"
                  className="ml-auto shrink-0 text-ink-3 transition-transform group-open:rotate-180"
                />
              </summary>
              <ul className="space-y-2 border-t border-rule px-3 py-3 text-sm leading-5 text-ink-2 [overflow-wrap:anywhere]">
                <li>Descarga el PNG (alta resolución) o el SVG y úsalo en una etiqueta, placa o colgante.</li>
                <li>Tamaño mínimo recomendado: 2.5 × 2.5 cm (elige 5 cm si va en una placa).</li>
                <li>No recortes el margen blanco alrededor del código.</li>
                <li>Evita rayones y cubre el QR con cinta transparente para uso físico.</li>
              </ul>
            </details>

            {copyFailed ? (
              <p role="status" className="text-center text-xs text-danger">
                No se pudo copiar, revisa los permisos del navegador.
              </p>
            ) : null}
            {downloadFailed ? (
              <p role="status" className="text-center text-xs text-danger">
                No se pudo generar la descarga. Inténtalo de nuevo.
              </p>
            ) : null}
          </>
        )}

        <span aria-live="polite" className="sr-only">
          {liveMessage}
        </span>
      </div>
    </Surface>
  );
}
