import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * `AppShell` monta `SiteNav` y `OfflineNavGuard`, que usan el router del App
 * Router. Aquí no hay router —estos tests no arrancan Next.js— así que se
 * sustituyen SOLO los hooks de navegación.
 *
 * `notFound()` se deja intacto a propósito: forma parte de la frontera de la
 * ruta con la UI ("no existe" se responde con un 404, no con un estado vacío) y
 * estos tests necesitan comprobarla de verdad.
 */
vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/",
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
  };
});

import Home from "@/app/page";
import AdopcionesPage from "@/app/adopciones/page";
import ProfilePage, {
  generateMetadata as profileMetadata,
  generateStaticParams as profileStaticParams,
} from "@/app/perfil/[id]/page";
import ShelterPage, {
  generateMetadata as shelterMetadata,
} from "@/app/refugios/[id]/page";
import AdoptionPetPage from "@/app/adopciones/[id]/page";
import { ThemeProvider } from "@/app/providers";

import {
  getAdoptionDemoPets,
  getAllPets,
  getAllProfilePets,
} from "@/lib/services/pets/queries";
import { getAdoptionCatalogEntries } from "@/lib/services/adoption/queries";
import { getMockShelters } from "@/lib/services/shelters/queries";
import { listActivePublicProfiles } from "@/lib/infra/directory/activePublicProfiles";

/**
 * Integración UI → Services (FASE 9B).
 *
 * Comprueba que las rutas obtienen sus datos **por los services** y no por la
 * fuente concreta, sin tocar la fuente: el contrato de lo que la UI puede
 * observar no ha cambiado en esta fase, así que la prueba es "la ruta pinta
 * exactamente lo que el service devuelve".
 *
 * Las rutas se ejecutan como funciones y se serializan con
 * `renderToStaticMarkup`, que es lo mismo que hace Next.js en el servidor. El
 * repositorio corre en `environment: "node"` y no hay jsdom ni Testing Library,
 * así que la interacción (el filtro por especie de la home, el envío del
 * formulario de adopción) queda fuera y la cierra el smoke manual en el
 * navegador. Lo que sí es verificable aquí es el contrato de datos.
 *
 * El `ThemeProvider` se monta porque es lo que hace `app/layout.tsx`: `AppShell`
 * incluye `ThemeToggle`, que necesita el contexto. Es la única diferencia con
 * el árbol real, y no altera los datos que se están comprobando.
 *
 * Lo que estos tests NO son: una prueba de la fuente. De que `mascotas.json`
 * siga siendo válido se encarga `assertValidPetProfiles` al importar el
 * adapter, y de que los datos sean coherentes, `npm run validate:data`.
 */

type RouteParams<P> = { params: Promise<P> };

function params<P>(value: P): Promise<P> {
  return Promise.resolve(value);
}

/** Serializa el árbol que Next.js compondría para una página concreta. */
function render(tree: React.ReactElement): string {
  return renderToStaticMarkup(createElement(ThemeProvider, null, tree));
}

/** Ruta asíncrona con `params`, como las de `/perfil/[id]` y `/refugios/[id]`. */
async function renderAsync<P>(
  Page: (props: RouteParams<P>) => Promise<React.ReactElement>,
  routeParams: P,
): Promise<string> {
  return render(await Page({ params: params(routeParams) }));
}

describe("home: la UI lista perfiles públicos, no el catálogo de adopción", () => {
  let html = "";

  beforeAll(async () => {
    html = render(await Home());
  });

  it("enlaza los perfiles que devuelve el directorio público", async () => {
    for (const pet of await listActivePublicProfiles()) {
      expect(html, `falta el enlace de ${pet.publicCode}`).toContain(`href="/perfil/${pet.publicCode}"`);
    }
  });

  it("el contador coincide con los perfiles públicos del service", async () => {
    const profiles = await listActivePublicProfiles();
    expect(html).toContain(`${profiles.length} ${profiles.length === 1 ? "mascota" : "mascotas"}`);
  });

  it("ofrece el directorio voluntario sin destacar una mascota por defecto", async () => {
    expect(html).toContain('href="/mascotas"');
    expect(html).toContain("Perfiles voluntarios");
    expect(html).not.toContain("Ver el perfil de");
  });

  it("no filtra mascotas del catálogo de adopción en la home", async () => {
    // `mascotas.json` y `adopciones.mock.json` son catálogos deliberadamente
    // distintos (ver el puerto `PetDirectory`). La home muestra perfiles, no
    // adoptables: si alguna adoptable se colara aquí, la frontera se habría roto.
    for (const pet of await getAdoptionDemoPets()) {
      expect(html, `${pet.id} no debería aparecer en la home`).not.toContain(
        `href="/perfil/${pet.id}"`,
      );
    }
  });
});

describe("perfil: la UI resuelve el identificador a través del service", () => {
  it("resuelve por id", async () => {
    const html = await renderAsync(ProfilePage, { id: "lucca" });

    expect(html).toContain("Lucca");
    expect(html).toContain("PC-LUCCA-001");
  });

  it("resuelve por codigoPublico, que es el alias estable de la URL", async () => {
    const byCode = await renderAsync(ProfilePage, { id: "PC-LUCCA-001" });
    const byId = await renderAsync(ProfilePage, { id: "lucca" });

    expect(byCode).toBe(byId);
  });

  it("prerenderiza aliases de los datos de demostración fuera de producción", async () => {
    const prerendered = (await profileStaticParams()).map((entry) => entry.id);
    const profiles = await getAllProfilePets();

    expect(prerendered).toHaveLength(profiles.length * 2);

    for (const pet of profiles) {
      expect(prerendered).toContain(pet.id);
      expect(prerendered).toContain(pet.identificacion.codigoPublico);
    }
  });

  it("el canonical y el OG apuntan al codigoPublico, no al id interno", async () => {
    const metadata = await profileMetadata({ params: params({ id: "lucca" }) });

    expect(metadata.alternates?.canonical).toBe("/p/PC-LUCCA-001");
    expect(metadata.openGraph?.url).toBe("/p/PC-LUCCA-001");
  });

  it("el perfil inexistente corta con notFound() en lugar de renderizar", async () => {
    await expect(renderAsync(ProfilePage, { id: "no-existe-xyz" })).rejects.toThrow();
  });

  it("el perfil inexistente se marca como no indexable", async () => {
    const metadata = await profileMetadata({ params: params({ id: "no-existe-xyz" }) });

    expect(metadata.robots).toEqual({ index: false });
  });
});

describe("ficha pública de adopción", () => {
  it("resuelve la mascota desde el contrato público y permite iniciar una solicitud", async () => {
    const [entry] = await getAdoptionCatalogEntries();
    const html = await renderAsync(AdoptionPetPage, { id: entry.petId });
    expect(html).toContain(entry.nombre);
    expect(html).toContain("Enviar solicitud");
    expect(html).toContain("permanecen protegidos");
  });
});

describe("adopciones: la UI consume el service de adopción y el de refugios", () => {
  let html = "";

  beforeAll(async () => {
    html = render(await AdopcionesPage());
  });

  it("enlaza entradas del contrato público a sus fichas de adopción", async () => {
    const entries = await getAdoptionCatalogEntries();
    for (const entry of entries) expect(html).toContain(`href="/adopciones/${entry.petId}"`);
  });

  it("el contador coincide con las mascotas publicadas", async () => {
    const entries = await getAdoptionCatalogEntries();
    expect(html).toContain(`${entries.length} mascotas en adopción`);
  });

  it("no mezcla el catálogo de perfiles propios en el de adopción", async () => {
    for (const pet of await getAllPets()) {
      expect(html, `${pet.id} es perfil propio, no adoptable`).not.toContain(
        `href="/perfil/${pet.id}"`,
      );
    }
  });

  it("enlaza a la ficha de cada refugio que devuelve el service", async () => {
    for (const shelter of await getMockShelters()) {
      expect(html, `falta el refugio ${shelter.id}`).toContain(`href="/refugios/${shelter.id}"`);
      expect(html).toContain(shelter.nombre);
    }
  });
});

describe("refugios: la UI consume el service de refugios", () => {
  it("la ficha del refugio muestra sus datos y sus mascotas", async () => {
    const [shelter] = await getMockShelters();
    const html = await renderAsync(ShelterPage, { id: shelter.id });

    expect(html).toContain(shelter.nombre);
    expect(html).toContain(shelter.ubicacion);

    for (const pet of await getAdoptionCatalogEntries()) {
      if (pet.shelterId === shelter.id) expect(html).toContain(`href="/adopciones/${pet.petId}"`);
    }
  });

  it("el refugio inexistente corta con notFound()", async () => {
    await expect(renderAsync(ShelterPage, { id: "no-existe-xyz" })).rejects.toThrow();
  });

  it("el refugio inexistente se marca como no indexable", async () => {
    const metadata = await shelterMetadata({ params: params({ id: "no-existe-xyz" }) });

    expect(metadata.robots).toEqual({ index: false });
  });
});
