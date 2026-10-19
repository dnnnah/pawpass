/**
 * Capa de infraestructura de almacenamiento local (FASE 7).
 *
 * Aísla el acceso a `localStorage` del resto de la aplicación:
 * - SSRR-safe: nunca toca `window` si no existe.
 * - Tolerante: nunca lanza por storage bloqueado (modo privado, cookies
 *   deshabilitadas, cuota excedida, datos corruptos).
 * - Pura y de infraestructura: sin React, sin Next.js, sin reglas de negocio.
 *
 * La lógica de dominio (p. ej. `parseLostAlert`) permanece fuera de esta capa;
 * aquí solo se resuelve la disponibilidad y el acceso seguro a los bytes.
 */

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const PROBE_KEY = "__pawpass_probe__";

/**
 * Devuelve `window.localStorage` de forma SSRR-safe.
 * `null` cuando no hay navegador (SSR) o cuando el acceso a storage está
 * bloqueado (p. ej. cookies deshabilitadas). Nunca lanza.
 */
export function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Comprueba si una instancia de storage es realmente utilizable mediante un
 * probe de escritura/lectura/borrado. `false` para storage bloqueado, lleno
 * o inexistente sin lanzar.
 */
export function isStorageAvailable(
  storage: StorageLike | null | undefined,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(PROBE_KEY, "1");
    storage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Lectura segura: devuelve `null` ante storage inexistente o errores. */
export function safeGetItem(
  storage: StorageLike | null | undefined,
  key: string,
): string | null {
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Escritura segura: devuelve `false` si el storage no es utilizable/falla. */
export function safeSetItem(
  storage: StorageLike | null | undefined,
  key: string,
  value: string,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Borrado seguro: devuelve `false` si el storage no es utilizable/falla. */
export function safeRemoveItem(
  storage: StorageLike | null | undefined,
  key: string,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lee y decodifica JSON de forma tolerante.
 *
 * `decode` recibe el valor ya parseado y devuelve el modelo tipado (o `null`
 * si la forma es inválida). Devuelve `null` ante: storage inexistente, clave
 * ausente, JSON inválido o forma inválida. Nunca lanza.
 */
export function readStoredJson<T>(
  storage: StorageLike | null | undefined,
  key: string,
  decode: (raw: unknown) => T | null,
): T | null {
  const raw = safeGetItem(storage, key);
  if (raw === null) {
    return null;
  }

  try {
    return decode(JSON.parse(raw));
  } catch {
    return null;
  }
}