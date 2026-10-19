# Producto

<!-- impeccable:product-schema 1 -->

## Plataforma

web

## Usuarios

El usuario principal es una persona dueña preocupada por una o más mascotas. Regresa a diario o cada
semana para consultar el calendario de vacunas, el historial médico, la credencial de identidad y los
datos de contacto que necesitaría para recuperar al animal. La sesión es corta, a menudo con una sola
mano, y con frecuencia está motivada por la preocupación más que por la administración rutinaria.

Otras audiencias presentes en el producto, sin haber sido entrevistadas de forma independiente: los
refugios que publican animales en adopción y las personas adopantes que los consultan.

## Propósito del producto

PawPass es el registro de identidad y cuidados de una mascota. Contiene el historial de vacunas y
médico, el carnet físico y digital, los documentos oficiales y los datos de contacto que hacen
recuperable al animal. También cubre los dos momentos que el registro en papel no puede: encontrar a
una mascota perdida y darle un nuevo hogar.

El éxito significa que una persona preocupada puede responder «a quién llamo» y «la vacuna está al día»
en segundos, puede entregar un expediente completo y legible en manos de un desconocido, y puede pasar
una mascota de perdida a adopcionada sin reconstruir nada.

## Posicionamiento

Una aplicación de mascotas vecina tendría que renunciar a uno de estos elementos para copiar el producto
con honestidad:

- **Un registro oficial imprimible.** El expediente y el carnet están diseñados para imprimirse y
  entregarse físicamente a un desconocido, no solo para leerse en una pantalla. La fidelidad de
  impresión es una funcionalidad del producto, no un recurso de último recurso.
- **Una alerta pública de pérdida.** Perder una mascota genera una página pública compartible con foto
  y datos de contacto, construida a partir del registro existente de la mascota en lugar de componerse
  desde cero bajo el estrés del momento.
- **Un ciclo cubierto, no una sola tarea.** Pérdida, recuperación y adopción son el mismo registro
  recorriendo estados distintos, así que no se vuelve a capturar nada entre ellos.
- **Privado por defecto.** Nada se publica sin consentimiento explícito. Una cuenta genérica de perfil
  de mascota difunde datos de identidad por defecto; PawPass publica elemento por elemento y solo
  cuando se solicita.

## Contexto de uso

El producto se usa en campo casi tanto como en un escritorio: un teléfono en una sola mano, a veces con
conexión deficiente y a menudo con ansiedad. La ruta de impresión se usa en una clínica, un refugio o
una comisaría, a veces con la impresora disponible en ese momento. Los registros de vacunación los leen
terceros, así que la legibilidad y la completitud importan más que el pulido en pantalla.

La aplicación es una web app con capacidad de PWA; se instala en la pantalla de inicio y se lanza como
una app nativa, pero no es una base de código nativa.

## Capacidades y restricciones

Capacidades confirmadas: perfiles de mascota con historial médico y de vacunas; un carnet digital
imprimible con código escaneable; un expediente oficial; documentos almacenados con categorización; un
estado de salud público; una alerta de pérdida con imagen y bloque de contacto; el hallazgo de
mascotas perdidas; y un catálogo de adopción de refugios.

Restricciones duraderas, todas confirmadas:

- **La impresión y la exportación a PDF son requisitos obligatorios.** Las maquetas de impresión son
  parte del producto. La ambición visual cede ante ellas siempre que entren en conflicto.
- **Móvil primero con datos lentos.** La experiencia debe sostenerse con conexión deficiente, por lo
  que el peso del payload y el costo de la primera carga son preocupaciones del producto, no solo de
  ingeniería.
- **Solo español, español de México.** Sin textos en inglés y sin mezcla de dialectos.

La semántica de los estados, la terminología, las rutas y el modelo de resolución de identidad/QR están
establecidos en el código y deben preservarse en cualquier trabajo futuro.

Sin decidir: si los envíos de solicitudes de adopción llegan alguna vez a un servidor. Hoy la solicitud
de adopción se guarda únicamente en el navegador de quien visita, y el contenido de adopción y refugio
son datos de prototipo.

## Compromisos de marca

El nombre es PawPass. Todos los textos del producto están en español (es-MX) y el tono es llano,
cálido y tranquilo: esos textos se dirigen a una persona ansiosa y nunca deben leerse como alarmistas
ni como un embudo de conversión.

## Evidencia disponible

Once perfiles de mascota reales están validados por `npm run validate:data`; el contenido de adopción y
refugio son datos de prototipo. La vista de adopción lo revela a quien visita dentro del producto, y esa
revelación es un hecho confirmado y no un marcador de posición. Los datos de contacto de ejemplo están
compartidos entre ocho perfiles y el validador los marca como pendientes de verificar antes de
producción.

El repositorio no contiene testimonios de clientes, métricas de uso, prensa, precios ni compromisos de
licencia. El trabajo futuro no debe inventarlos.

## Principios de producto

1. **La impresión es el producto.** Si un cambio se ve mejor en pantalla pero se imprime peor, está mal.
2. **La ansiedad es el estado inicial.** Optimizar para la persona preocupada; nunca fabricar urgencia para
   aumentar la interacción.
3. **Nada es público sin consentimiento.** Publicar es un acto explícito, elemento por elemento.
4. **Reutilizar el registro.** Cada flujo lee de los datos existentes de la mascota, así que nadie
   vuelve a capturar lo que el producto ya sabe.
5. **Diseñar para una mala conexión y una sola mano.** Móvil con datos lentos es el objetivo de diseño,
   no un afterthought responsive.

## Accesibilidad e inclusión

El producto se usa en situaciones estresantes, al aire libre y con una sola mano, a menudo por alguien
angustiado, así que el tipo legible, las áreas táctiles amplias y el soporte completo de teclado son
requisitos funcionales y no un añadido de pulido. La salida impresa debe seguir siendo legible en blanco
y negro y para lectores con baja visión. El orden del foco y los landmarks deben poder usarse sin
puntero.
