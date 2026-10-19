import { describe, expect, it } from "vitest";
import {
  buildPetProfileMetadata,
  getPetProfileSeoDescription,
  getPetProfileSeoTitle,
} from "@/lib/seo";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import type { PetProfile } from "@/types/pet";

type AnyRecord = Record<string, unknown>;

function ogFields(metadata: ReturnType<typeof buildPetProfileMetadata>): AnyRecord {
  return metadata.openGraph as AnyRecord;
}

function twitterFields(metadata: ReturnType<typeof buildPetProfileMetadata>): AnyRecord {
  return metadata.twitter as AnyRecord;
}

function makePet(overrides: Partial<PetProfile> = {}): PetProfile {
  const base: PetProfile = {
    id: "lucca",
    estado: "en_casa",
    verificado: true,
    mascota: {
      nombre: "Lucca",
      especie: "Perro",
      raza: "Golden Retriever",
      fotoPerfilUrl: "/pets/lucca.jpeg",
      genero: "Macho",
      talla: "Grande",
      color: "Dorado",
      pesoKg: 30,
      fechaNacimiento: "2020-01-01",
      rasgosDistintivos: ["Colarín"],
      esterilizado: true,
    },
    identificacion: { codigoPublico: "PC-LUCCA-001", microchip: null, notas: "" },
    contacto: {
      nombrePublico: "Dueño",
      telefonoPrincipal: "5551234567",
      whatsapp: "5215551234567",
      telefonoSecundario: "",
      email: "",
      zonaSegura: "Colonia Centro",
      zonaHabitual: "Parque",
      mensajeWhatsapp: "Encontré a Lucca",
    },
    emergencia: {
      perdido: false,
      fechaPerdida: null,
      zonaPerdida: null,
      mensajeEmergencia: null,
      recompensa: null,
      instrucciones: [],
    },
    salud: {
      alergias: [],
      condicionesMedicas: [],
      medicamentosActuales: [],
      dietaEspecial: "",
      comportamiento: "Amistoso",
    },
    veterinario: {
      nombre: "Dr. Test",
      clinica: "Clínica Test",
      telefono: "5551234567",
      direccion: "Calle 1",
      horario: "L-V 9-18",
    },
    vacunas: [],
    documentos: [],
    configuracionPublica: {
      mostrarEmail: false,
      mostrarTelefonoSecundario: false,
      mostrarDireccionVet: true,
      mostrarDocumentosPrivados: false,
    },
  };

  return { ...base, ...overrides };
}

describe("getPetProfileSeoTitle", () => {
  it("usa el nombre en un perfil normal", () => {
    expect(getPetProfileSeoTitle(makePet())).toBe("Lucca | PawPass");
  });

  it("antecede 'está perdido' cuando la mascota está en modo perdido", () => {
    const pet = makePet({ emergencia: { ...makePet().emergencia, perdido: true } });
    expect(getPetProfileSeoTitle(pet)).toBe("Lucca está perdido | PawPass");
  });
});

describe("getPetProfileSeoDescription", () => {
  it("deriva raza y especie del perfil", () => {
    expect(getPetProfileSeoDescription(makePet())).toBe(
      "Perfil público de Lucca, Golden Retriever · Perro.",
    );
  });

  it("agrega el aviso de modo perdido", () => {
    const pet = makePet({ emergencia: { ...makePet().emergencia, perdido: true } });
    expect(getPetProfileSeoDescription(pet)).toContain("modo perdido");
  });
});

describe("buildPetProfileMetadata", () => {
  it("usa el codigoPublico como canonical, nunca pet.id", () => {
    const metadata = buildPetProfileMetadata(makePet());
    expect(metadata.alternates?.canonical).toBe(getPublicProfileUrl(makePet()));
    expect(metadata.alternates?.canonical).toContain("PC-LUCCA-001");
    expect(metadata.alternates?.canonical).not.toContain("/perfil/lucca");
  });

  it("no filtra pet.id en ningun campo generado", () => {
    const metadata = JSON.stringify(buildPetProfileMetadata(makePet()));
    expect(metadata).not.toContain("/perfil/lucca");
    expect(metadata).not.toContain('"id":"lucca"');
  });

  it("expone title/description/canonical consistentes en openGraph", () => {
    const metadata = buildPetProfileMetadata(makePet());
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    expect(ogFields(metadata).type).toBe("website");
    expect(ogFields(metadata).siteName).toBe("PawPass");
    expect(ogFields(metadata).locale).toBe("es_MX");
  });

  it("usa la foto del perfil como imagen social con alt del nombre", () => {
    const metadata = buildPetProfileMetadata(makePet());
    expect(metadata.openGraph?.images).toEqual([{ url: "/pets/lucca.jpeg", alt: "Lucca" }]);
    expect(twitterFields(metadata).card).toBe("summary_large_image");
    expect(metadata.twitter?.images).toEqual([{ url: "/pets/lucca.jpeg", alt: "Lucca" }]);
  });

  it("cae a summary sin imagen cuando el perfil no tiene foto", () => {
    const pet = makePet({ mascota: { ...makePet().mascota, fotoPerfilUrl: "" } });
    const metadata = buildPetProfileMetadata(pet);
    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
    expect(twitterFields(metadata).card).toBe("summary");
  });

  it("omite el canonical si el perfil no tiene codigoPublico", () => {
    const pet = makePet({ identificacion: { ...makePet().identificacion, codigoPublico: "" } });
    const metadata = buildPetProfileMetadata(pet);
    expect(metadata.alternates?.canonical).toBeUndefined();
    expect(metadata.openGraph?.url).toBeUndefined();
  });
});