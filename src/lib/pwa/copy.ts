/**
 * Copy de la experiencia sin conexión y de instalación (FASE 7B).
 *
 * Vive en un módulo aparte, sin React y sin navegador, por dos razones: se
 * testea como dato y no como maqueta, y no se puede prometer nada que la
 * aplicación no haga.
 *
 * REGLA DE HONESTIDAD (la razón de que este archivo exista):
 * PawPass **no tiene backend**. No existe sincronización remota, ni cola de
 * pendientes, ni envío diferido. Por eso ninguna línea de este archivo dice
 * "se sincronizará", "se guardará en la nube" o "se enviará más tarde": sería
 * una promesa que el producto no puede cumplir. Lo que sí se puede decir, y es
 * lo único que se dice, es qué ocurre en este dispositivo y qué no.
 */

export const OFFLINE_BANNER_COPY = {
  /** Etiqueta corta del estado; se anuncia a tecnologías asistivas. */
  label: "Sin conexión",
  titulo: "Estás sin conexión",
  cuerpo:
    "Puedes seguir consultando la información que ya abriste en este dispositivo. Lo que no hayas abierto antes no se puede mostrar todavía.",
  /** Salida clara y accionable sin conexión. */
  accion: "Volver al inicio",
} as const;

export const OFFLINE_RETURNED_COPY = {
  titulo: "Conexión recuperada",
  cuerpo: "Vuelves a estar en línea.",
} as const;

export const OFFLINE_ROUTE_BLOCKED_COPY = {
  titulo: "Esta sección no está disponible sin conexión",
  cuerpo:
    "PawPass guarda en este dispositivo las páginas que ya abriste. Vuelve a estar en línea para abrir esta sección por primera vez.",
  accion: "Volver al inicio",
} as const;

export const INSTALL_CTA_COPY = {
  titulo: "Instala PawPass",
  cuerpo:
    "Ten el carnet de tu mascota a mano en el celular, incluso sin señal.",
  accion: "Instalar app",
  descartar: "Ahora no",
  etiquetaGrupo: "Instalación de la app",
} as const;

/**
 * Instrucciones manuales. Solo se usan en iOS, detectadas en tiempo de
 * ejecución, y solo cuando no hay diálogo nativo: ahí el gesto de compartir es
 * la única vía y la instrucción evita que alguien busque un botón que no
 * existe. No se hardcodean pasos de ningún otro navegador.
 */
export const INSTALL_MANUAL_COPY = {
  titulo: "Añade PawPass a tu pantalla de inicio",
  cuerpo:
    "En tu iPhone, toca Compartir y luego «Añadir a pantalla de inicio». A partir de ahí se abre como una app y funciona aunque no haya señal.",
  etiquetaGrupo: "Instalación de la app",
} as const;

/**
 * Aviso honesto sobre la alerta de mascota perdida: el estado del modo alerta
 * vive en el almacenamiento local de **este** dispositivo. No hay servidor que
 * lo difunda, así que la UI no puede insinuar lo contrario.
 */
export const LOST_MODE_LOCAL_COPY = {
  aviso: "Este aviso se guarda solo en este dispositivo.",
  detalle:
    "PawPass todavía no tiene servidor: la alerta no se envía a otros teléfonos por sí sola. Para que alguien la vea, comparte el enlace o la imagen de la alerta.",
} as const;
