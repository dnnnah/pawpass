# Revisión responsive de PawPass

## Correcciones

- El encabezado mantiene el menú desplegable hasta que caben los enlaces completos. El logo, la navegación y el cambio de tema ocupan columnas reales, sin superposición absoluta.
- Las tarjetas de administración usan una columna en móvil, dos desde 768 px y tres desde 1280 px. Las acciones de pérdida usan todo el ancho disponible.
- Las superficies, los campos y las columnas pueden encogerse sin que las URL, identificadores, nombres o controles nativos ensanchen la página.
- El QR queda limitado por su tarjeta; sus acciones se distribuyen según el ancho del propio contenedor.
- Los campos usan texto de 16 px en móvil y los botones compactos conservan 44 px de alto en ese tamaño.
- La navegación del carnet se desplaza dentro de su propia fila, conserva las etiquetas y queda debajo del encabezado. Los destinos de sección reservan espacio para ambos menús.
- La foto principal conserva su proporción. El visor de la galería mantiene sus controles y descripción dentro de la pantalla, incluso en horizontal; bloquea el desplazamiento del fondo y mantiene el foco dentro del diálogo.

## Evidencia en navegador

Se revisó una ruta temporal con los componentes reales y datos ficticios: tarjetas propias, alerta activa, nombre e identificador largos, carnet, QR, galería, formularios de salud y archivos, ajustes de cuenta y cartel de pérdida. La ruta temporal se eliminó al terminar.

| Ancho del viewport | Ancho del documento | Columnas de mascotas |
| --- | --- | --- |
| 320 px | 320 px | 1 |
| 375 px | 375 px | 1 |
| 430 px | 430 px | 1 |
| 640 px | 640 px | 1 |
| 768 px | 768 px | 2 |
| 1024 px | 1024 px | 2 |
| 1280 px | 1280 px | 3 |
| 1440 px | 1440 px | 3 |
| 1920 px | 1920 px | 3 |

Antes de corregir, la misma composición alcanzaba 431 px de ancho con un viewport de 320 px y 1066 px con uno de 1024 px. Después no se detectaron elementos que escaparan del viewport, salvo los destinos contenidos en la navegación horizontal intencional.

También se abrieron las rutas reales de inicio, acceso, adopciones, mascotas públicas, perdidas y refugios a 320, 768 y 1280 px. Se revisó un perfil voluntario público a 320, 375, 768, 1024 y 1440 px. Todos mantuvieron el ancho del documento dentro del viewport. El listado real de adopción estaba vacío; sus tarjetas se revisaron con fixtures.

En el visor se probaron abrir, avanzar y cerrar fotos. A 812 × 375 px la imagen terminó en y=249 y la descripción comenzó en y=269; los tres botones mantuvieron 44 × 44 px y quedaron dentro de la pantalla. También se comprobaron 375 × 812 y 320 × 568 px.

El menú móvil midió 288 px y quedó entre x=16 y x=304 en una pantalla de 320 px. Los campos del reporte de pérdida conservaron 224 px dentro de su tarjeta y texto de 16 px. El registro de cuenta y la edición del carnet se inspeccionaron sin enviar formularios.

## Alcance de la verificación

La evidencia corresponde al navegador del entorno de revisión con viewports emulados, clics y teclado. No representa pruebas físicas en Safari de iPhone o Android, ni gestos táctiles sintetizados. Las pantallas privadas se revisaron con fixtures; no se inició sesión ni se modificaron datos reales.
