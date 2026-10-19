/**
 * Instalación de la PWA: detección de capacidad, de aplicación ya instalada y
 * de la visibilidad del CTA (FASE 7B).
 *
 * Sigue la misma disciplina que `connectivity.ts`: tokens de navegador solo
 * dentro de guards SSR-safe, y toda la decisión de *qué mostrar* en funciones
 * puras que se pueden testear sin navegador.
 *
 * No se inventa capacidad: si el navegador no expone `beforeinstallprompt`, esta
 * capa dice que no se puede instalar programáticamente en lugar de fingir un
 * botón.
 */

/** Clave de `localStorage` con el descarte del CTA en este dispositivo. */
export const INSTALL_DISMISS_KEY = "pawpass-pwa-install-dismissed:v1";

/** `navigator.standalone` es la forma propia de iOS (Safari), no estándar. */
type IosNavigator = Navigator & { standalone?: boolean };

/**
 * Modos de visualización en los que la app ya corre instalada. Los tres abren
 * una ventana propia o a pantalla completa: si cualquiera coincide, no hay nada
 * que instalar.
 */
const INSTALLED_DISPLAY_MODES = ["standalone", "minimal-ui", "fullscreen"] as const;

function getWindow(): (Window & typeof globalThis) | null {
  return typeof window === "undefined" ? null : window;
}

function getNavigator(): Navigator | null {
  return typeof navigator === "undefined" ? null : navigator;
}

/** Evento `beforeinstallprompt`, que la plataforma no tipa en TypeScript. */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * `true` cuando el navegador expone la API de instalación programática.
 * Safari en iOS y los navegadores de escritorio sin instalación de sitio
 * devuelven `false`: ahí no hay botón que ofrezca la instalación, solo
 * instrucciones.
 */
export function isInstallApiSupported(): boolean {
  const win = getWindow();
  if (!win) return false;

  try {
    return "onbeforeinstallprompt" in win;
  } catch {
    return false;
  }
}

/**
 * `true` cuando PawPass ya se está ejecutando como aplicación instalada
 * (ventana propia o pantalla de inicio). Cubre `display-mode: standalone`,
 * `minimal-ui` y `fullscreen`, y el `navigator.standalone` de iOS.
 */
export function isAppInstalled(): boolean {
  const win = getWindow();
  const nav = getNavigator();

  if (!win) return false;

  try {
    const media = win.matchMedia;
    if (typeof media !== "function") {
      // Sin `matchMedia` no hay forma estándar de saberlo; se cae al resto de
      // señales en lugar de inventar un resultado.
    } else {
      for (const mode of INSTALLED_DISPLAY_MODES) {
        if (media.call(win, `(display-mode: ${mode})`).matches) {
          return true;
        }
      }
    }
  } catch {
    /* `matchMedia` lanzando: seguimos con el resto de señales. */
  }

  if (nav) {
    try {
      if ((nav as IosNavigator).standalone === true) return true;
    } catch {
      /* Acceso denegado: no es una señal fiable. */
    }
  }

  return false;
}

export type InstallCtaVisibilityInput = {
  /** El navegador permite lanzar el diálogo de instalación. */
  supported: boolean;
  /** Ya se capturó un `beforeinstallprompt` utilizable. */
  promptAvailable: boolean;
  /** La app ya está instalada. */
  installed: boolean;
  /** El usuario descartó el CTA en este dispositivo. */
  dismissed: boolean;
};

export type InstallCtaVisibility = "hidden" | "available";

/**
 * Decide si el CTA de instalación debe verse. Un único motivo por el que se
 * esconde: o no se puede instalar, o ya está instalada, o el usuario dijo que
 * no. Sin esto, el CTA reaparece en cada navegación y molesta.
 *
 * Un navegador sin `beforeinstallprompt` **no** habilita el CTA: no hay forma
 * honesta de disparar la instalación, así que la UI no ofrece un botón falso.
 */
export function resolveInstallCtaVisibility({
  supported,
  promptAvailable,
  installed,
  dismissed,
}: InstallCtaVisibilityInput): InstallCtaVisibility {
  if (installed) return "hidden";
  if (dismissed) return "hidden";
  if (!supported) return "hidden";
  return promptAvailable ? "available" : "hidden";
}

/**
 * Estado de una PWA no instalable, para poder explicar el caso en lugar de
 * callarse. No se usa para pintar un botón: solo para copy.
 */
export type InstallHintInput = {
  /** Ya está instalada: no hay nada que explicar. */
  installed: boolean;
  /** El usuario ya lo descartó. */
  dismissed: boolean;
  /** Corre en iOS/iPadOS, donde no hay instalación programática. */
  ios: boolean;
  /** Hay un diálogo nativo disponible, que siempre es mejor que instrucciones. */
  promptAvailable: boolean;
};

export type InstallHintVisibility = "hidden" | "manual";

/**
 * Decide si se muestran instrucciones manuales de instalación.
 *
 * Se reservan a iOS, y solo a iOS: allí no existe `beforeinstallprompt`, así que
 * la única forma de instalar es el gesto "Compartir → Añadir a pantalla de
 * inicio". En cualquier otro navegador sin API, la instalación o no es posible
 * o se hace desde un menú que el usuario ya conoce, y una instrucción inventada
 * solo sería ruido. Con diálogo nativo disponible, el botón gana siempre.
 */
export function resolveInstallHintVisibility({
  installed,
  dismissed,
  ios,
  promptAvailable,
}: InstallHintInput): InstallHintVisibility {
  if (installed) return "hidden";
  if (dismissed) return "hidden";
  if (promptAvailable) return "hidden";
  return ios ? "manual" : "hidden";
}

/**
 * `true` en iOS/iPadOS, donde no existe instalación programática: la única vía
 * es el gesto "Compartir → Añadir a pantalla de inicio". Es el caso más común en
 * campo y el único en el que una instrucción corta sustituye a un botón.
 */
export function isIosSafariLike(nav: Navigator | null = getNavigator()): boolean {
  if (!nav) return false;

  try {
    const userAgent = typeof nav.userAgent === "string" ? nav.userAgent : "";
    if (userAgent === "") return false;

    // iPadOS se presenta como macOS y por eso no contiene "iPad". La única
    // señal que lo distingue de un Mac de escritorio es la pantalla táctil.
    // Este caso se comprueba **antes** de buscar tokens de iPhone/iPad, o
    // un iPad se leería como un escritorio cualquiera.
    if (/Macintosh/.test(userAgent)) {
      return typeof nav.maxTouchPoints === "number" && nav.maxTouchPoints > 1;
    }

    return /iPad|iPhone|iPod/.test(userAgent);
  } catch {
    return false;
  }
}
