/**
 * Estado de instalación de la PWA, fuera de React (FASE 7B).
 *
 * Dos decisiones que se explican aquí porque no son obvias:
 *
 * **1. Las escuchas se registran al evaluarse el módulo, no al suscribirse.**
 * El navegador emite `beforeinstallprompt` cuando la app ya cumple los
 * requisitos de instalabilidad, y ese momento no está ligado al ciclo de vida de
 * React. Si el listener se pusiera en un `useEffect` o al primer `subscribe()`,
 * un evento emitido antes de la hidratación se perdería para siempre y el CTA
 * no aparecería nunca en esa sesión. En el cliente, un módulo se evalúa al
 * cargarse el bundle, que es antes de hidratar.
 *
 * **2. `installed` se lee al arrancar, no solo a partir de `appinstalled`.**
 * Si la app ya está instalada y la persona la abre desde su pantalla de inicio,
 * no habrá ningún `appinstalled` en toda la sesión. Sin esta lectura, quien ya
 * tenga PawPass instalado seguiría viendo el aviso de instalarlo.
 *
 * Como en `connectivityStore`, el estado vive en el módulo y se lee con
 * `useSyncExternalStore`: un solo valor, estable entre renders y comparable con
 * `Object.is`, que es lo que evita bucles de render.
 */

import { isAppInstalled, type BeforeInstallPromptEvent } from "@/lib/pwa/install";
import { readInstallDismissed, writeInstallDismissed } from "@/lib/pwa/installDismiss";
import { getBrowserStorage } from "@/lib/pwa/storage";

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export type InstallStateSnapshot = {
  /** Hay un `beforeinstallprompt` capturado y utilizable. */
  canInstall: boolean;
  /** PawPass ya se está ejecutando como app instalada. */
  installed: boolean;
  /** El usuario descartó el aviso en este dispositivo. */
  dismissed: boolean;
};

/**
 * Objetos congelados y reutilizados. `useSyncExternalStore` compara por
 * identidad: devolver un objeto nuevo en cada lectura provocaría un render
 * infinito, así que solo se crean cuando el estado cambia de verdad.
 */
const HIDDEN: InstallStateSnapshot = Object.freeze({
  canInstall: false,
  installed: false,
  dismissed: false,
});

const AVAILABLE: InstallStateSnapshot = Object.freeze({
  canInstall: true,
  installed: false,
  dismissed: false,
});

const DISMISSED: InstallStateSnapshot = Object.freeze({
  canInstall: false,
  installed: false,
  dismissed: true,
});

let capturedPrompt: BeforeInstallPromptEvent | null = null;
let state: InstallStateSnapshot = HIDDEN;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of [...listeners]) {
    listener();
  }
}

function handleBeforeInstallPrompt(event: Event) {
  // Sin `preventDefault`, el navegador muestra su propio mini-infobar y el CTA
  // de la app queda duplicado. Prevenirlo es lo que pide la API.
  event.preventDefault();
  capturedPrompt = event as BeforeInstallPromptEvent;
  // Una app ya instalada no debe volver a ofrecer instalarse, aunque el
  // navegador emita el evento: `appinstalled` pudo noarse en sesiones previas.
  state = state.installed ? state : AVAILABLE;
  emit();
}

function handleAppInstalled() {
  capturedPrompt = null;
  state = Object.freeze({ canInstall: false, installed: true, dismissed: state.dismissed });
  emit();
}

/** Recalcula el estado contra lo que dice el almacenamiento del navegador. */
function syncDismissed() {
  const dismissed = readInstallDismissed(getBrowserStorage());
  if (dismissed === state.dismissed) return;

  state = dismissed ? DISMISSED : capturedPrompt ? AVAILABLE : HIDDEN;
  emit();
}

let wired = false;

/**
 * Registra las escuchas una sola vez por carga de página. Es idempotente para
 * que llamarla desde varios puntos no duplica handlers: con duplicados,
 * `beforeinstallprompt` dispararía dos emissions por evento.
 */
export function wireInstallListeners(): void {
  if (wired) return;
  if (typeof window === "undefined") return;
  wired = true;

  // Antes de escuchar: una app ya instalada arranca con este estado en `true`.
  if (isAppInstalled()) {
    state = Object.freeze({ ...state, installed: true });
  }
  syncDismissed();

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
}

// Se ejecuta al importar el módulo en el cliente, antes de que React monte.
wireInstallListeners();

export function subscribeInstallState(listener: Listener): () => void {
  wireInstallListeners();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getInstallStateSnapshot(): InstallStateSnapshot {
  return state;
}

/**
 * Instantánea de servidor y de primer render. Sin datos de navegador no se puede
 * saber nada, y fingir `canInstall: true` en el HTML inicial provocaría un
 * salto de layout en cuanto hidratara.
 */
export function getServerInstallStateSnapshot(): InstallStateSnapshot {
  return HIDDEN;
}

/** Lanza el diálogo nativo de instalación. */
export async function promptInstall(): Promise<InstallOutcome> {
  const prompt = capturedPrompt;
  if (!prompt) return "unavailable";

  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;

    if (choice.outcome === "accepted") {
      // `appinstalled` llegará después; soltar el prompt ya evita que un
      // segundo clic dispare el diálogo otra vez.
      capturedPrompt = null;
      state = Object.freeze({ canInstall: false, installed: state.installed, dismissed: state.dismissed });
      emit();
    }
    return choice.outcome;
  } catch {
    // El navegador puede rechazar el diálogo (contexto no permitido, gesto
    // perdido, ya instalado). No es un error que merezca mostrarse.
    return "unavailable";
  }
}

/** Cierra el aviso y no vuelve a molestar en este dispositivo. */
export function dismissInstallPrompt(): void {
  writeInstallDismissed(getBrowserStorage(), true);
  state = DISMISSED;
  capturedPrompt = null;
  emit();
}

/** Devuelve el store a su estado inicial. Solo lo usan los tests. */
export function resetInstallStore(): void {
  capturedPrompt = null;
  wired = false;
  state = HIDDEN;
  listeners.clear();
}
