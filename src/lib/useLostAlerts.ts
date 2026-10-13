import { useCallback, useSyncExternalStore } from "react";
import { parseLostAlertDraft } from "@/lib/domain/emergency";
import {
  invalidateLostAlertCache,
  readLostAlert,
  writeLostAlert,
} from "@/lib/lostAlertStorage";
import { getBrowserStorage } from "@/lib/pwa/storage";
import type { LostAlert, LostAlertDraft } from "@/types/emergency";

export type { LostAlert, LostAlertDraft };

const PREFIX = "pawpass-alerta:v1:";
const EVENT = "pawpass-lost-mode";

function keyOf(petId: string) {
  return `${PREFIX}${String(petId)}`;
}

function subscribe(petId: string, onChange: () => void) {
  const key = keyOf(petId);

  const onStorage = (event: StorageEvent) => {
    if (event.key === key) {
      invalidateLostAlertCache(key);
      onChange();
    }
  };

  const onCustom = () => {
    invalidateLostAlertCache(key);
    onChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onCustom);
  };
}

function notifyAlertChange() {
  window.dispatchEvent(new Event(EVENT));
}

export function useLostAlerts(petId: string) {
  const key = keyOf(petId);

  const alert = useSyncExternalStore<LostAlert | null>(
    (onChange) => subscribe(petId, onChange),
    () => readLostAlert(getBrowserStorage(), key),
    () => null
  );

  const activate = useCallback(
    (draft: LostAlertDraft) => {
      writeLostAlert(getBrowserStorage(), key, parseLostAlertDraft(draft));
      notifyAlertChange();
    },
    [key]
  );

  const deactivate = useCallback(() => {
    writeLostAlert(getBrowserStorage(), key, null);
    notifyAlertChange();
  }, [key]);

  return { alert, activate, deactivate };
}