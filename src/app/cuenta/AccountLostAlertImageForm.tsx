"use client";

import { useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { LostPetAlertImage } from "@/components/features/lost-pet/LostPetAlertImage";
import { formatMexicanDate } from "@/lib/dateFormat";

type Props = {
  petName: string;
  species: string;
  breed: string;
  color: string;
  distinctiveTraits: string[];
  photoUrl: string | null;
  contactValue: string;
  contactLabel: string;
  contactHint: string;
  profileUrl: string;
  zone: string;
  date: string;
  reward: string;
  message: string;
};

function fileSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mascota";
}

export function AccountLostAlertImageForm(props: Props) {
  const alertRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [zone, setZone] = useState(props.zone);
  const [date, setDate] = useState(props.date);
  const [reward, setReward] = useState(props.reward);
  const [message, setMessage] = useState(props.message);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const photoUrl = photo ?? props.photoUrl;
  const formattedDate = date ? formatMexicanDate(date) ?? date : "";
  const imageName = `pawpass-alerta-${fileSlug(props.petName)}.png`;

  function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(selected);
    event.target.value = "";
  }

  async function downloadImage() {
    setBusy("download"); setNotice(null); setError(null);
    try {
      const element = alertRef.current;
      if (!element) throw new Error("No pudimos preparar la imagen.");
      const dataUrl = await toPng(element, { pixelRatio: 3, backgroundColor: "#ffffff", cacheBust: true });
      const link = document.createElement("a");
      link.download = imageName;
      link.href = dataUrl;
      link.click();
      setNotice("Imagen descargada. Ya puedes compartirla por tus redes o mensajería.");
    } catch {
      setError("No pudimos generar la imagen. Intenta de nuevo.");
    } finally { setBusy(null); }
  }

  async function shareImage() {
    setBusy("share"); setNotice(null); setError(null);
    try {
      const element = alertRef.current;
      if (!element) throw new Error("No pudimos preparar la imagen.");
      const blob = await toBlob(element, { pixelRatio: 3, backgroundColor: "#ffffff", cacheBust: true });
      if (!blob) throw new Error("No pudimos generar la imagen.");
      const file = new File([blob], imageName, { type: "image/png" });
      const shareText = `SE BUSCA: ${props.petName} (${props.species})\n${zone ? `Última vez visto: ${zone}\n` : ""}${message ? `${message}\n` : ""}Más información: ${props.profileUrl}`;
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
        return;
      }
      const link = document.createElement("a");
      link.download = imageName;
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setNotice("Este dispositivo no permite compartir desde aquí. La imagen se descargó para que la compartas.");
    } catch (failure) {
      if (failure instanceof DOMException && failure.name === "AbortError") return;
      setError("No pudimos compartir la imagen. Intenta descargarla.");
    } finally { setBusy(null); }
  }

  return <div className="space-y-6">
    <section className="rounded-lg border border-rule bg-surface p-5 sm:p-6" aria-labelledby="personalizar-alerta-titulo">
      <h2 id="personalizar-alerta-titulo" className="font-display text-2xl text-ink">Personaliza la imagen</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">Los cambios solo afectan la imagen que descargarás o compartirás; la alerta pública permanece como la configuraste.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id="alerta-imagen-zona" label="Última vez visto">
          {(field) => <input {...field} maxLength={200} value={zone} onChange={(event) => setZone(event.target.value)} />}
        </Field>
        <Field id="alerta-imagen-fecha" label="Fecha de pérdida">
          {(field) => <input {...field} type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
        </Field>
        <Field id="alerta-imagen-recompensa" label="Recompensa (MXN) · opcional">
          {(field) => <input {...field} type="number" min="0" value={reward} onChange={(event) => setReward(event.target.value)} />}
        </Field>
        <div className="flex flex-wrap items-end gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center rounded-md border border-edge bg-surface px-3 text-sm font-semibold text-ink hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Cambiar foto para la imagen</button>
          {photo ? <button type="button" onClick={() => setPhoto(null)} className="min-h-11 px-2 text-sm font-semibold text-brand underline">Restaurar foto del carnet</button> : null}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} className="hidden" />
        </div>
        <Field id="alerta-imagen-mensaje" label="Mensaje de alerta · opcional" className="sm:col-span-2">
          {(field) => <textarea {...field} rows={3} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} />}
        </Field>
      </div>
    </section>

    <section className="flex flex-col items-center gap-5" aria-labelledby="vista-alerta-titulo">
      <h2 id="vista-alerta-titulo" className="font-display text-xl text-ink">Vista previa</h2>
      <div className="w-full max-w-xl"><div ref={alertRef}>
        <LostPetAlertImage
          petName={props.petName} species={props.species} breed={props.breed} color={props.color}
          distinctiveTraits={props.distinctiveTraits} photoUrl={photoUrl} lostZone={zone} lostDate={formattedDate}
          reward={reward.trim() && Number.isFinite(Number(reward)) ? Number(reward) : null} message={message}
          contactPhone={props.contactValue} contactLabel={props.contactLabel} contactHint={props.contactHint}
          profileUrl={props.profileUrl}
        />
      </div></div>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => void downloadImage()} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-on-solid hover:bg-ink-2 disabled:opacity-50">
          <Download size={17} aria-hidden="true" />{busy === "download" ? "Generando…" : "Descargar imagen PNG"}
        </button>
        <button type="button" onClick={() => void shareImage()} disabled={busy !== null} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-edge bg-surface px-4 text-sm font-semibold text-ink hover:bg-sunken disabled:opacity-50">
          <Share2 size={17} aria-hidden="true" />{busy === "share" ? "Compartiendo…" : "Compartir"}
        </button>
      </div>
      {error ? <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p> : null}
      {notice ? <p role="status" className="rounded-md bg-success-soft px-4 py-3 text-sm text-success">{notice}</p> : null}
    </section>
  </div>;
}
