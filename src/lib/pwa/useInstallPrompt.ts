"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isInstallApiSupported, isIosSafariLike } from "@/lib/pwa/install";
import {
  dismissInstallPrompt,
  getInstallStateSnapshot,
  getServerInstallStateSnapshot,
  promptInstall,
  subscribeInstallState,
  type InstallOutcome,
} from "@/lib/pwa/installStore";

/**
 * Envoltura de React para el estado de instalación (FASE 7B).
 *
 * Todo el estado real —incluido el `beforeinstallprompt`, que puede llegar
 * antes de que React exista— vive en `installStore`. Aquí solo se traduce a
 * `useSyncExternalStore`, que garantiza que el render del servidor y el primer
 * render del cliente coincidan y no disparen un aviso que después desaparezca.
 */
export type UseInstallPromptResult = {
  /** Hay un diálogo nativo de instalación disponible. */
  canInstall: boolean;
  /** PawPass ya se está ejecutando como app instalada. */
  isInstalled: boolean;
  /** El navegador expone la API de instalación. */
  isSupported: boolean;
  /** Corre en iOS/iPadOS, donde instalar es un gesto y no un diálogo. */
  isIos: boolean;
  /** El usuario descartó el aviso en este dispositivo. */
  dismissed: boolean;
  /** Abre el diálogo nativo de instalación. */
  install: () => Promise<InstallOutcome>;
  /** Cierra el aviso y no vuelve a molestar en este dispositivo. */
  dismiss: () => void;
};

export function useInstallPrompt(): UseInstallPromptResult {
  const { canInstall, installed, dismissed } = useSyncExternalStore(
    subscribeInstallState,
    getInstallStateSnapshot,
    getServerInstallStateSnapshot
  );

  // Lecturas del entorno, estables durante la sesión: no necesitan store ni
  // estado, y así no provocan un render extra.
  const isSupported = isInstallApiSupported();
  const isIos = isIosSafariLike();

  const install = useCallback(() => promptInstall(), []);
  const dismiss = useCallback(() => dismissInstallPrompt(), []);

  return {
    canInstall,
    isInstalled: installed,
    isSupported,
    isIos,
    dismissed,
    install,
    dismiss,
  };
}
