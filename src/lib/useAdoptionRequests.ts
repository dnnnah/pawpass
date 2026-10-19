import { useCallback, useSyncExternalStore } from "react";
import {
  appendAdoptionRequest,
  invalidateAdoptionRequestsCache,
  readAdoptionRequests,
} from "@/lib/adoptionRequestStorage";
import { getBrowserStorage } from "@/lib/pwa/storage";
import type { AdoptionRequest } from "@/types/adoption";

export type { AdoptionRequest };

const PREFIX = "pawpass-adopcion:v1:";
const EVENT = "pawpass-adoption-requests";

function keyOf(petId: string) {
  return `${PREFIX}${String(petId)}`;
}

function subscribe(petId: string, onChange: () => void) {
  const key = keyOf(petId);

  const onStorage = (event: StorageEvent) => {
    if (event.key === key) {
      invalidateAdoptionRequestsCache(key);
      onChange();
    }
  };

  const onCustom = () => {
    invalidateAdoptionRequestsCache(key);
    onChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onCustom);
  };
}

function notifyRequestsChange() {
  window.dispatchEvent(new Event(EVENT));
}

export function useAdoptionRequests(petId: string) {
  const key = keyOf(petId);

  const requests = useSyncExternalStore<AdoptionRequest[]>(
    (onChange) => subscribe(petId, onChange),
    () => readAdoptionRequests(getBrowserStorage(), key),
    () => []
  );

  const submit = useCallback(
    (request: AdoptionRequest) => {
      const result = appendAdoptionRequest(getBrowserStorage(), key, request);
      notifyRequestsChange();
      return result;
    },
    [key]
  );

  return { requests, submit, key };
}