# Activar los métodos de acceso de PawPass

Proyecto Supabase: `gjolkedvspnmueqatqyt`.

Web pública temporal: `https://pet-carnet.vercel.app`.

## Estado comprobado

- Google está habilitado en Supabase con el cliente web `PawPass Web` del proyecto Google Cloud `pawpass-512801`.
- El panel de facturación de Google confirma que el proyecto no tiene una cuenta de facturación vinculada.
- Google Auth Platform está en modo de prueba; se añadió la cuenta del propietario como usuario de prueba. La prueba local completó el acceso a Mi cuenta.
- Apple permanece deshabilitado. Su acceso web requiere una membresía de Apple Developer, por lo que no se activó bajo el requisito de cero gasto.
- El registro por correo está habilitado y requiere confirmación.
- La única cuenta actual ya está confirmada. Puede iniciar sesión con su contraseña; solicitar su confirmación de nuevo no prueba la entrega de correo a una cuenta nueva.
- Los registros recientes muestran registros repetidos y reenvíos con HTTP 200. Esa respuesta no acredita que un mensaje haya llegado al buzón.
- El propietario confirmó que el correo de confirmación ya llega. Esta reparación no cambió SMTP; los registros iniciados desde localhost conservan el retorno local.

La pantalla de acceso consulta los proveedores habilitados. Los botones de Google y Apple permanecen visibles, pero los proveedores pendientes aparecen deshabilitados y marcados como «No disponible». Después de activar Google o Apple, basta con recargar `/login`.

## URLs de retorno

En [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/gjolkedvspnmueqatqyt/auth/url-configuration), establecer `https://pet-carnet.vercel.app` como Site URL y permitir las URLs de retorno:

```text
http://localhost:3000/auth/callback
https://pet-carnet.vercel.app/auth/callback
http://localhost:3000/auth/callback?next=**
https://pet-carnet.vercel.app/auth/callback?next=**
```

Usar el mismo origen y puerto con los que se abre la app. Añadir el dominio definitivo cuando exista. El subdominio de Vercel permite alojar la app, pero no proporciona control del DNS de un dominio remitente de correo.

La URL que Google y Apple necesitan como retorno es otra: primero devuelven el acceso a Supabase, que después redirige a la app:

```text
https://gjolkedvspnmueqatqyt.supabase.co/auth/v1/callback
```

## Google

1. En [Google Cloud](https://console.cloud.google.com/auth/clients), crear un proyecto y configurar la pantalla de consentimiento de Google Auth Platform.
2. Crear un cliente OAuth de tipo **Aplicación web**. Para desarrollo, añadir `http://localhost:3000` como origen autorizado y la URL de retorno de Supabase indicada arriba como URI de redireccionamiento autorizada.
3. Si la aplicación está en modo de pruebas, añadir las cuentas con las que se probará como usuarios de prueba.
4. En [Supabase → Authentication → Providers](https://supabase.com/dashboard/project/gjolkedvspnmueqatqyt/auth/providers), abrir Google, introducir el Client ID y Client Secret y habilitarlo.

Las credenciales se guardan en Supabase, no en variables `NEXT_PUBLIC_*`.

Fuente: [Google con Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

## Apple

1. Configurar Sign in with Apple en la cuenta de [Apple Developer](https://developer.apple.com/account/).
2. Preparar el App ID, un Services ID para la web y una clave de Sign in with Apple. Para este flujo OAuth, registrar `gjolkedvspnmueqatqyt.supabase.co` como dominio web y la URL de retorno de Supabase indicada arriba.
3. Generar el secreto OAuth siguiendo la guía de Apple de Supabase.
4. Introducir el Services ID y el secreto en el proveedor Apple de Supabase y habilitarlo.
5. Renovar el secreto OAuth antes de su caducidad; Apple exige su regeneración cada seis meses para este flujo web.

Fuente: [Apple con Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple).

## Correo de confirmación

1. Crear una cuenta con un proveedor que ofrezca SMTP y verificar el dominio/remitente siguiendo sus instrucciones.
2. En [Supabase → Authentication → SMTP](https://supabase.com/dashboard/project/gjolkedvspnmueqatqyt/auth/smtp), habilitar SMTP propio y guardar host, puerto, usuario, contraseña, dirección y nombre del remitente que indique el proveedor.
3. Revisar los registros de envío del proveedor si Supabase acepta el envío pero no se recibe el mensaje.
4. Probar el registro con una dirección controlada que aún no tenga cuenta y abrir su enlace. No usar la cuenta ya confirmada para comprobar este flujo.

El SMTP integrado de Supabase restringe los destinatarios a los miembros autorizados del equipo y tiene límites bajos. La entrega a usuarios reales requiere SMTP propio. Las variables de correo de adopciones del proyecto no configuran los correos de Supabase Auth.

Fuente: [SMTP con Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

### Preparar una prueba con Brevo

1. Crear una cuenta en [Brevo](https://www.brevo.com/) y verificar la dirección que se usará como remitente desde Settings → Senders. Si su dominio no está autenticado, Brevo solicita un código enviado a esa dirección.
2. Abrir Settings → SMTP & API y obtener el login SMTP y una clave SMTP. La clave SMTP es distinta de la contraseña de la cuenta y de una API key.
3. Copiar en el panel SMTP de Supabase:

| Campo | Valor |
| --- | --- |
| Host | `smtp-relay.brevo.com` |
| Puerto | `587` |
| Usuario | El login mostrado en la sección SMTP de Brevo |
| Contraseña | La clave SMTP generada en Brevo |
| Remitente | La dirección verificada en Brevo |
| Nombre | `PawPass` |

La disponibilidad de envío depende de la validación y las restricciones de la cuenta del proveedor. Con remitentes de servicios gratuitos, Brevo puede sustituir temporalmente la dirección de envío por una compatible. Para el envío definitivo, usar un dominio propio autenticado.

Fuentes: [verificar remitente](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email), [SMTP](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP), [requisitos de remitentes](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders).

## Versión local y versión publicada

Los cambios en este checkout no actualizan automáticamente la web de Vercel. La comprobación de la URL pública mostró la interfaz anterior y, al pulsar Google, el aviso de que Supabase no está conectado. Hay que configurar la URL y una clave pública de Supabase en Vercel y volver a generar el despliegue para que Next.js las incorpore. `NEXT_PUBLIC_SUPABASE_ANON_KEY` mantiene la compatibilidad con la versión publicada; la versión local también admite `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. No usar una clave secreta o `service_role` para esos campos.

En `http://localhost:3000/login`, Google ya aparece habilitado y la prueba usa `scope=email profile`, vuelve al callback local y abre Mi cuenta con sesión. Apple permanece visible y deshabilitado. Publicar el código local y configurar los servicios de Auth son pasos distintos.

## Comprobación final

- Una cuenta existente entra con correo y contraseña.
- Una dirección nueva recibe su confirmación y vuelve a `/cuenta` después de abrir el enlace en el mismo navegador donde se registró.
- Cada proveedor activado se habilita en `/login` y completa el retorno a la app con sesión.
- Si un proveedor se deshabilita después de cargar la página, pulsar su botón muestra un aviso dentro del formulario.

Las claves privadas, contraseñas SMTP y secretos OAuth deben introducirse en sus paneles correspondientes; no se guardan en este documento ni en el repositorio.
