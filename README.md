# PawPass

**Un lugar para cuidar a tus mascotas y una forma más simple de ayudarlas a volver a casa.**

PawPass es una aplicación web para tutores de perros y gatos. Reúne las fichas de las mascotas, sus cuidados, un carnet digital, herramientas para casos de extravío y Pawgram, un espacio social para compartir fotos. Su punto de partida es una idea concreta: cuando alguien encuentra una mascota con una placa QR, debería poder consultar una ficha de rescate desde su teléfono, sin instalar una aplicación ni pasar por un registro.

La ficha QR es solo una parte del producto. El tutor también puede organizar la información de cada mascota, preparar un cartel cuando se pierde y mantener a mano sus registros de salud. PawPass está pensado para que estas tareas estén conectadas: la ficha de la mascota alimenta las herramientas de rescate, mientras que el carnet y la actividad social tienen sus propios espacios.

## La idea detrás del proyecto

Encontrar una mascota perdida suele ser una situación urgente. Una placa con un QR permite que quien la encuentre llegue rápidamente a una página de ayuda; una alerta de pérdida y un cartel permiten extender la búsqueda más allá de ese encuentro. PawPass une esos momentos con el cuidado diario: no hace falta empezar de cero cada vez que pasa algo.

El recorrido principal es sencillo:

1. **Registrá una mascota.** Creá su ficha con los datos básicos y completala a tu ritmo.
2. **Prepará su QR.** La placa lleva a una ficha de rescate que se puede abrir en cualquier navegador compatible.
3. **Llevá sus cuidados.** Anotá alertas, indicaciones y registros en el carnet digital.
4. **Actuá si se pierde.** Publicá una alerta, generá un cartel y actualizá el caso cuando vuelva a casa.
5. **Compartí otros momentos.** Si querés, usá Pawgram para mostrar fotos de tu mascota.

## Funcionalidades

### Fichas de mascotas

Cada mascota tiene un espacio propio desde el que el tutor puede consultar y actualizar su información. El alta comienza con unos pocos datos básicos; otros detalles se pueden agregar después. La ficha funciona como punto de entrada a las herramientas de rescate, alertas, carnet y Pawgram, sin obligar a completar todo de una vez.

### Placa QR y ficha de rescate

La placa QR conecta el mundo físico con una página de la mascota. Si alguien la encuentra, puede escanear el código con su teléfono y abrir la ficha desde el navegador. La experiencia está pensada para ser directa: reconocer a la mascota, leer las indicaciones de rescate disponibles y poder ayudar sin tener una cuenta en PawPass.

El QR conserva su utilidad en distintos momentos de la vida de la mascota. Cuando hay una búsqueda activa, la ficha también orienta hacia el aviso correspondiente; cuando se registra el regreso a casa, vuelve al recorrido habitual.

### Alertas de cuidado

El tutor puede anotar indicaciones que conviene tener presentes al cuidar o encontrar una mascota: por ejemplo, alergias, condiciones, medicación, cuidados especiales o temperamento. Estas alertas acompañan la ficha de la mascota y ayudan a organizar la información importante sin depender de notas dispersas.

### Pérdida, búsqueda y recuperación

Ante un extravío, PawPass permite abrir un aviso con la información disponible e ir completándolo conforme aparecen nuevos datos. El proyecto incluye un tablón de mascotas perdidas y una página de detalle para cada búsqueda activa.

Para mover la búsqueda fuera de la aplicación, el tutor puede preparar un cartel con la foto de la mascota, su QR y los datos del aviso. Cuando la mascota regresa, puede marcar el caso como recuperado. Así se cierra el episodio de búsqueda sin confundirlo con la ficha cotidiana de la mascota.

### Carnet digital

El carnet reúne registros de vacunas, desparasitaciones, intervenciones y documentos de la mascota. Sirve para consultar antecedentes y ordenar próximas fechas registradas por el tutor. Es una herramienta de organización: no reemplaza el diagnóstico ni las indicaciones de un profesional veterinario.

### Pawgram

Pawgram es la parte social de PawPass. Allí se pueden explorar perfiles de mascotas y publicaciones con fotos. El tutor decide si quiere participar con cada mascota; también puede preparar su perfil, publicar imágenes y acompañar publicaciones de otros con «patitas». El espacio social no es necesario para usar las funciones de cuidado o rescate.

### Demo y uso como PWA

La demo permite recorrer ejemplos con mascotas ficticias y conocer parte de la experiencia sin crear una cuenta. Es una buena primera parada para entender cómo se presentan las fichas y los avisos.

PawPass es una aplicación web progresiva (PWA): se puede abrir en el navegador y agregar a la pantalla de inicio en dispositivos compatibles. La instalación no reemplaza la conexión necesaria para consultar o actualizar información de la aplicación.

## Un ejemplo de uso

Imaginá a una tutora que acaba de adoptar una perra. Primero crea su ficha con nombre, especie y una foto. Más adelante completa sus cuidados y registra las vacunas en el carnet digital. La placa QR de la mascota lleva a una ficha que una persona puede abrir con la cámara de su teléfono si algún día la encuentra sola.

Si la perra se pierde, la tutora inicia una alerta con la información que tiene en ese momento. El aviso aparece en el tablón y puede transformarse en un cartel para compartir durante la búsqueda. A medida que recibe nueva información, actualiza el aviso. Cuando la mascota vuelve a casa, marca la recuperación y el QR sigue sirviendo para su ficha habitual.

En otro momento, esa misma tutora puede publicar una foto en Pawgram. La participación social es opcional: el valor de la ficha, el carnet y las herramientas de búsqueda no depende de publicar contenido.

## Qué incluye y qué no

PawPass combina herramientas de **cuidado, rescate, búsqueda y comunidad** en una misma aplicación. No pretende ser un servicio de rastreo GPS ni una consulta veterinaria. El QR ayuda a conectar a quien encuentra una mascota con su ficha; no indica por sí mismo dónde está. El carnet ayuda a ordenar los registros; las decisiones clínicas siguen correspondiendo a profesionales.

La aplicación se puede instalar como PWA, pero instalarla no significa que todas sus funciones estén disponibles sin conexión. Estas distinciones son importantes para saber qué esperar antes de usarla.

## Tecnologías y organización

La interfaz usa **React, Next.js y TypeScript**. **Supabase** aporta los servicios de datos del proyecto. Las pruebas de código se ejecutan con **Vitest** y las de navegador con **Playwright**. El código agrupa cada capacidad en módulos, de modo que sus componentes y lógica relacionada se mantengan cerca.

| Ubicación | Contenido |
|---|---|
| `src/app` | Páginas, rutas y composición de la aplicación. |
| `src/features` | Capacidades del producto organizadas por módulo. |
| `src/lib` | Utilidades e integraciones compartidas. |
| `supabase` | Configuración, migraciones y datos de desarrollo. |
| `public` | Recursos estáticos y materiales de la demo. |
| `tests` | Pruebas de los recorridos de la aplicación. |

Para profundizar en el alcance del producto y sus decisiones funcionales, consultá [PRODUCT.md](PRODUCT.md). Las pautas de interfaz están en [DESIGN.md](DESIGN.md).

## Ejecutar el proyecto en local

### Requisitos previos

- **Node.js 22** y **npm** para instalar dependencias e iniciar Next.js.
- **Docker** para levantar los servicios de Supabase local.
- Supabase CLI está incluida entre las dependencias de desarrollo y se puede ejecutar con `npx`.

### Instalación

Desde la raíz del repositorio, instalá las dependencias y prepará un archivo de configuración para tu entorno de desarrollo:

```sh
npm ci
cp .env.example .env.local
```

Completá el archivo local con valores de **tu propio entorno de desarrollo**. No uses datos de cuentas reales para experimentar con el proyecto.

### Servicios locales

Con Docker en marcha, iniciá Supabase y prepará la base de datos de desarrollo:

```sh
npx supabase start
npm run db:reset
```

`db:reset` reinicia **la base local** y carga migraciones y datos de desarrollo. No lo ejecutes sobre una base con información que quieras conservar.

Después, iniciá la aplicación:

```sh
npm run dev
```

Abrí la dirección local que Next.js indique en la terminal. Para conocer la experiencia sin preparar un recorrido completo, podés comenzar por la demo.

## Comandos disponibles

| Comando | Uso |
|---|---|
| `npm run dev` | Inicia Next.js en modo desarrollo. |
| `npm run build` | Genera la compilación de la aplicación. |
| `npm run start` | Ejecuta la aplicación compilada. |
| `npm test` | Ejecuta las pruebas unitarias con Vitest. |
| `npm run lint` | Revisa el proyecto con ESLint. |
| `npm run typecheck` | Comprueba los tipos de TypeScript. |
| `npm run test:e2e` | Ejecuta las pruebas de navegador con Playwright; requiere la compilación y los servicios locales. |
| `npm run audit:assets` | Audita los recursos por ruta; requiere una compilación previa. |
| `npm run db:reset` | Reinicia la base de datos de desarrollo local. |

Para una comprobación habitual de cambios de código, ejecutá las pruebas unitarias, el análisis estático y la comprobación de tipos. Las pruebas de navegador requieren preparar previamente la compilación y los servicios indicados arriba.

## Preguntas frecuentes

**¿Hace falta instalar PawPass para consultar una placa QR?**

No. La ficha se abre en un navegador compatible desde el enlace de la placa.

**¿Puedo probar la experiencia sin cargar mascotas propias?**

Sí. La demo presenta fichas y situaciones ficticias para recorrer la aplicación.

**¿Pawgram es obligatorio para usar las herramientas de rescate?**

No. Es una parte opcional del producto y tiene su propio recorrido.

**¿El carnet digital reemplaza una libreta veterinaria o una consulta?**

No. Ayuda a ordenar información y documentos, pero no emite diagnósticos ni indicaciones clínicas.

**¿Por dónde empiezo si quiero entender el código?**

Leé primero la estructura de este README; después elegí una funcionalidad en `src/features` y seguí su página correspondiente en `src/app`.

## Qué encontrar en este repositorio

Este README es la puerta de entrada: explica el propósito de PawPass, sus capacidades y cómo ponerlo en marcha para desarrollo. Si necesitás conocer el comportamiento esperado con más detalle, seguí por **PRODUCT.md**; si trabajás en pantallas o componentes, consultá **DESIGN.md**. El código en `src/features` permite recorrer cada funcionalidad por separado, mientras que `src/app` muestra cómo se conectan las páginas de la aplicación.
