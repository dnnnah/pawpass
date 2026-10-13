import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPhysicalPetCard } from "@/lib/domain/carnet";
import { getAdoptionDemoPets, getAllPets } from "@/lib/services/pets/queries";
import { getPublicProfileUrl } from "@/lib/publicProfileUrl";
import type { PhysicalPetCard } from "@/types/carnet";
import type { LostAlert } from "@/types/emergency";
import type { PetGender, PetProfile, PetSize } from "@/types/pet";

const TODAY = "2026-09-20";
const APP_URL = "https://petcarnet.example";

afterEach(() => {
  vi.unstubAllEnvs();
});

function makePet(overrides: Partial<PetProfile> = {}): PetProfile {
  return {
    id: "p-luna",
    estado: "en_casa",
    verificado: true,
    mascota: {
      nombre: "Luna",
      especie: "Gato",
      raza: "Doméstico",
      fotoPerfilUrl: "/pets/luna.jpeg",
      genero: "Hembra",
      talla: "Pequeño",
      color: "Negro",
      pesoKg: 4,
      fechaNacimiento: "2021-03-10",
      rasgosDistintivos: ["Mancha blanca en el pecho"],
      esterilizado: true,
    },
    identificacion: { codigoPublico: "PC-LUNA-001", microchip: "ABC123", notas: "" },
    contacto: {
      nombrePublico: "Fam. Luna",
      telefonoPrincipal: "5555555555",
      whatsapp: "5555555555",
      telefonoSecundario: "5522222222",
      email: "familia@example.com",
      zonaSegura: "Condesa",
      zonaHabitual: "Condesa",
      mensajeWhatsapp: "Hola, tengo a Luna",
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
      alergias: ["Maní"],
      condicionesMedicas: ["Cardiopatía"],
      medicamentosActuales: ["Cardipet"],
      dietaEspecial: "Sin granos",
      comportamiento: "Tímida",
    },
    veterinario: {
      nombre: "Dr. López",
      clinica: "Vet Central",
      telefono: "5551111111",
      direccion: "Av. Principal 123",
      horario: "9-18",
    },
    vacunas: [
      {
        id: "vac-1",
        nombre: "Rabia",
        fechaAplicacion: "2026-01-10",
        proximaDosis: "2027-01-10",
        estatus: "al_dia",
        lote: "L-1",
        veterinario: "Dr. López",
        documentoUrl: "/docs/rabia.pdf",
      },
    ],
    desparasitaciones: [
      {
        id: "desp-1",
        producto: "Praziquantel",
        fecha: "2026-06-01",
        proximaFecha: "2026-12-01",
      },
    ],
    historialMedico: [
      {
        id: "cons-1",
        fecha: "2026-08-10",
        motivo: "Chequeo",
        diagnostico: "Sano",
        tratamiento: "",
        medicamentos: [],
        documentos: [],
      },
    ],
    documentos: [{ id: "doc-1", nombre: "Certificado", tipo: "pdf", categoria: "salud", url: "/docs/cert.pdf", fecha: "2026-01-01", visiblePublico: true }],
    configuracionPublica: {
      mostrarEmail: true,
      mostrarTelefonoSecundario: true,
      mostrarDireccionVet: true,
      mostrarDocumentosPrivados: false,
    },
    ...overrides,
  };
}

function buildCard(pet: PetProfile, options?: { alert?: LostAlert | null; formato?: "tarjeta_imprimible" | "credencial" | "placa_dije"; today?: string }): PhysicalPetCard {
  return buildPhysicalPetCard(pet, options);
}

describe("FASE 6 — carnet físico: identidad e identificación", () => {
  it("1. mascota completa: expone identidad, contacto, salud y QR", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", APP_URL);
    const card = buildCard(makePet(), { today: TODAY });

    expect(card.mascota.nombre).toBe("Luna");
    expect(card.mascota.especie).toBe("Gato");
    expect(card.mascota.raza).toBe("Doméstico");
    expect(card.mascota.fotoUrl).toBe("/pets/luna.jpeg");
    expect(card.mascota.genero).toBe("Hembra");
    expect(card.mascota.talla).toBe("Pequeño");
    expect(card.mascota.color).toBe("Negro");
    expect(card.mascota.pesoKg).toBe(4);
    expect(card.mascota.fechaNacimiento).toBe("2021-03-10");
    expect(card.mascota.rasgosDistintivos).toEqual(["Mancha blanca en el pecho"]);
    expect(card.mascota.esterilizado).toBe(true);
    expect(card.mascota.verificado).toBe(true);

    expect(card.identificacion.codigoPublico).toBe("PC-LUNA-001");
    expect(card.identificacion.microchip).toBe("ABC123");

    expect(card.contacto.nombrePublico).toBe("Fam. Luna");
    expect(card.contacto.telefono).toBe("5555555555");
    expect(card.contacto.telefonoSecundario).toBe("5522222222");
    expect(card.contacto.email).toBe("familia@example.com");
    expect(card.contacto.whatsapp).toBe("5555555555");
    expect(card.contacto.whatsappUrl).toBe(
      `https://wa.me/525555555555?text=${encodeURIComponent("Hola, tengo a Luna")}`,
    );

    expect(card.salud.alergias).toEqual(["Maní"]);
    expect(card.salud.condicionesMedicas).toEqual(["Cardiopatía"]);
    expect(card.salud.medicamentosActuales).toEqual(["Cardipet"]);
    expect(card.salud.vacunas).toEqual([{ nombre: "Rabia", estatus: "al_dia" }]);
    expect(card.salud.desparasitaciones).toEqual([
      { producto: "Praziquantel", fecha: "2026-06-01", proximaFecha: "2026-12-01", dosis: null, veterinario: null },
    ]);
    expect(card.salud.historialMedico).toEqual([
      { fecha: "2026-08-10", motivo: "Chequeo", diagnostico: "Sano", tratamiento: null, medicamentos: [] },
    ]);
    expect(card.salud.veterinario).toEqual({
      nombre: "Dr. López",
      clinica: "Vet Central",
      telefono: "5551111111",
    });

    expect(card.estado.status).toBe("en_casa");
    expect(card.estado.esTerminal).toBe(false);
    expect(card.estado.perdido).toBe(false);
    expect(card.emergencia.activo).toBe(false);

    expect(card.print.formato).toBe("tarjeta_imprimible");
    expect(card.print.orientacion).toBe("vertical");
    expect(card.print.qrMinimoMm).toBe(25);
    expect(card.generadoEn).toBe(TODAY);
  });

  it("2. mascota sin foto: fotoUrl es null y el carnet se construye igual", () => {
    const card = buildCard(makePet({ mascota: { ...makePet().mascota, fotoPerfilUrl: "" } }), { today: TODAY });
    expect(card.mascota.fotoUrl).toBeNull();
    expect(card.mascota.nombre).toBe("Luna");
  });

  it("3. mascota sin contacto: teléfono, WhatsApp y email ausentes no rompen el carnet", () => {
    const card = buildCard(
      makePet({
        contacto: {
          nombrePublico: "",
          telefonoPrincipal: "",
          whatsapp: "",
          telefonoSecundario: "",
          email: "",
          zonaSegura: "",
          zonaHabitual: "",
          mensajeWhatsapp: "",
        },
      }),
      { today: TODAY },
    );

    expect(card.contacto.nombrePublico).toBeNull();
    expect(card.contacto.telefono).toBeNull();
    expect(card.contacto.telefonoSecundario).toBeNull();
    expect(card.contacto.email).toBeNull();
    expect(card.contacto.whatsapp).toBeNull();
    expect(card.contacto.whatsappUrl).toBeNull();
    expect(card.contacto.zonaSegura).toBeNull();
    expect(card.contacto.zonaHabitual).toBeNull();
  });

  it("3b. contacto respeta la privacidad por diseño: email y teléfono secundario ocultos si el perfil lo pide", () => {
    const base = makePet();
    const card = buildCard(
      makePet({
        contacto: base.contacto,
        configuracionPublica: {
          ...base.configuracionPublica,
          mostrarEmail: false,
          mostrarTelefonoSecundario: false,
        },
      }),
      { today: TODAY },
    );

    expect(card.contacto.email).toBeNull();
    expect(card.contacto.telefonoSecundario).toBeNull();
    expect(card.contacto.telefono).toBe("5555555555");
  });

  it("4. mascota sin información de salud: resumen sanitario vacío tolerado", () => {
    const card = buildCard(
      makePet({
        salud: { alergias: [], condicionesMedicas: [], medicamentosActuales: [], dietaEspecial: "", comportamiento: "" },
        veterinario: { nombre: "", clinica: "", telefono: "", direccion: "", horario: "" },
        vacunas: [],
        desparasitaciones: [],
        historialMedico: [],
      }),
      { today: TODAY },
    );

    expect(card.salud.alergias).toEqual([]);
    expect(card.salud.condicionesMedicas).toEqual([]);
    expect(card.salud.medicamentosActuales).toEqual([]);
    expect(card.salud.vacunas).toEqual([]);
    expect(card.salud.desparasitaciones).toEqual([]);
    expect(card.salud.historialMedico).toEqual([]);
    expect(card.salud.veterinario).toBeNull();
  });

  it("5. mascota perdida: deriva el modo perdido del estado efectivo y expone instrucciones", () => {
    const card = buildCard(
      makePet({
        emergencia: {
          perdido: true,
          fechaPerdida: "2026-09-18",
          zonaPerdida: "Parque México",
          mensajeEmergencia: "Es muy tímida, acércate con calma",
          recompensa: 500,
          instrucciones: ["No persigas", "Contacta de inmediato"],
        },
        estado: "perdido",
      }),
      { today: TODAY },
    );

    expect(card.estado.perdido).toBe(true);
    expect(card.estado.status).toBe("perdido");
    expect(card.estado.esTerminal).toBe(false);
    expect(card.emergencia.activo).toBe(true);
    expect(card.emergencia.zonaPerdida).toBe("Parque México");
    expect(card.emergencia.fechaPerdida).toBe("2026-09-18");
    expect(card.emergencia.mensaje).toBe("Es muy tímida, acércate con calma");
    expect(card.emergencia.recompensa).toBe(500);
    expect(card.emergencia.instrucciones).toEqual(["No persigas", "Contacta de inmediato"]);
  });

  it("5b. mascota perdida por alerta de runtime (no estática): la alerta prevalece", () => {
    const alert: LostAlert = {
      active: true,
      zonaPerdida: "Condesa",
      fechaPerdida: "2026-09-19",
      mensaje: "Se perdió hoy",
      recompensa: 1000,
    };
    const card = buildCard(makePet(), { alert, today: TODAY });

    expect(card.estado.perdido).toBe(true);
    expect(card.estado.status).toBe("perdido");
    expect(card.emergencia.activo).toBe(true);
    expect(card.emergencia.zonaPerdida).toBe("Condesa");
    expect(card.emergencia.fechaPerdida).toBe("2026-09-19");
    expect(card.emergencia.mensaje).toBe("Se perdió hoy");
    expect(card.emergencia.recompensa).toBe(1000);
  });

  it("6. mascota en adopción: representa el estado sin tratarla como perdida", () => {
    const card = buildCard(makePet({ estado: "en_adopcion" }), { today: TODAY });

    expect(card.estado.status).toBe("en_adopcion");
    expect(card.estado.esTerminal).toBe(false);
    expect(card.estado.perdido).toBe(false);
    expect(card.emergencia.activo).toBe(false);
    expect(card.emergencia.instrucciones).toEqual([]);
  });

  it("7. mascota fallecida: nunca aparece perdida ni con acciones urgentes", () => {
    const card = buildCard(
      makePet({ estado: "fallecido", emergencia: { ...makePet().emergencia } }),
      { today: TODAY },
    );

    expect(card.estado.status).toBe("fallecido");
    expect(card.estado.esTerminal).toBe(true);
    expect(card.estado.perdido).toBe(false);
    expect(card.emergencia.activo).toBe(false);
    expect(card.emergencia.zonaPerdida).toBeNull();
    expect(card.emergencia.fechaPerdida).toBeNull();
    expect(card.emergencia.mensaje).toBeNull();
    expect(card.emergencia.recompensa).toBeNull();
    expect(card.emergencia.instrucciones).toEqual([]);
    expect(card.qr.url).not.toBeNull();
  });

  it("8. código público válido: genera QR disponible con la URL canónica", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", APP_URL);
    const card = buildCard(makePet(), { today: TODAY });

    expect(card.qr.disponible).toBe(true);
    expect(card.qr.url).toBe(`${APP_URL}/perfil/PC-LUNA-001`);
  });

  it("9. código público inválido: QR no disponible y URL nula sin romper el carnet", () => {
    const base = makePet();
    for (const codigoPublico of ["", "   "]) {
      const card = buildCard(
        makePet({
          identificacion: { ...base.identificacion, codigoPublico },
          configuracionPublica: base.configuracionPublica,
        }),
        { today: TODAY },
      );
      expect(card.qr.disponible).toBe(false);
      expect(card.qr.url).toBeNull();
      expect(card.identificacion.codigoPublico).toBe(codigoPublico);
    }
  });

  it("10. URL pública: colapsa a ruta relativa sin base y compone absoluta con base", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const relative = buildCard(makePet(), { today: TODAY });
    expect(relative.qr.url).toBe("/perfil/PC-LUNA-001");

    vi.stubEnv("NEXT_PUBLIC_APP_URL", APP_URL.replace(/\/+$/, ""));
    const absolute = buildCard(makePet(), { today: TODAY });
    expect(absolute.qr.url).toBe(`${APP_URL}/perfil/PC-LUNA-001`);
  });

  it("11. QR: codifica la URL pública existente y NUNCA pet.id", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", APP_URL);
    const pet = makePet();
    const card = buildCard(pet, { today: TODAY });

    expect(card.qr.url).toBe(getPublicProfileUrl(pet));
    expect(card.qr.url).toContain(pet.identificacion.codigoPublico);
    expect(card.qr.url).not.toContain(pet.id);
  });

  it("12. información parcial: mezcla de datos ausentes se normaliza sin lanzar", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", APP_URL);
    const card = buildCard(
      makePet({
        mascota: { ...makePet().mascota, fotoPerfilUrl: "", genero: "" as PetGender, color: "" },
        contacto: {
          nombrePublico: "Fam.",
          telefonoPrincipal: "5555555555",
          whatsapp: "",
          telefonoSecundario: "",
          email: "",
          zonaSegura: "Condesa",
          zonaHabitual: "",
          mensajeWhatsapp: "",
        },
        veterinario: { nombre: "Dr. López", clinica: "", telefono: "", direccion: "", horario: "" },
        vacunas: [],
        historialMedico: [],
        identificacion: { ...makePet().identificacion, microchip: "" },
      }),
      { today: TODAY },
    );

    expect(card.mascota.fotoUrl).toBeNull();
    expect(card.mascota.genero).toBeNull();
    expect(card.mascota.color).toBeNull();
    expect(card.contacto.whatsapp).toBeNull();
    expect(card.contacto.whatsappUrl).toBeNull();
    expect(card.contacto.telefonoSecundario).toBeNull();
    expect(card.contacto.email).toBeNull();
    expect(card.contacto.zonaHabitual).toBeNull();
    expect(card.identificacion.microchip).toBeNull();
    expect(card.salud.vacunas).toEqual([]);
    expect(card.salud.veterinario).toEqual({ nombre: "Dr. López", clinica: "", telefono: "" });
    expect(card.qr.disponible).toBe(true);
  });

  it("13. datos vacíos: perfil mínimo construye un carnet vacío y sin QR", () => {
    const empty: PetProfile = {
      id: "p-vacia",
      estado: "en_casa",
      verificado: false,
      mascota: {
        nombre: "",
        especie: "Gato",
        raza: "",
        fotoPerfilUrl: "",
        genero: "" as PetGender,
        talla: "" as PetSize,
        color: "",
        pesoKg: 0,
        fechaNacimiento: "",
        rasgosDistintivos: [],
        esterilizado: false,
      },
      identificacion: { codigoPublico: "", microchip: null, notas: "" },
      contacto: {
        nombrePublico: "",
        telefonoPrincipal: "",
        whatsapp: "",
        telefonoSecundario: "",
        email: "",
        zonaSegura: "",
        zonaHabitual: "",
        mensajeWhatsapp: "",
      },
      emergencia: {
        perdido: false,
        fechaPerdida: null,
        zonaPerdida: null,
        mensajeEmergencia: null,
        recompensa: null,
        instrucciones: [],
      },
      salud: { alergias: [], condicionesMedicas: [], medicamentosActuales: [], dietaEspecial: "", comportamiento: "" },
      veterinario: { nombre: "", clinica: "", telefono: "", direccion: "", horario: "" },
      vacunas: [],
      documentos: [],
      configuracionPublica: {
        mostrarEmail: false,
        mostrarTelefonoSecundario: false,
        mostrarDireccionVet: false,
        mostrarDocumentosPrivados: false,
      },
    };

    const card = buildCard(empty, { today: TODAY });

    expect(card.mascota.nombre).toBeNull();
    expect(card.mascota.fotoUrl).toBeNull();
    expect(card.identificacion.microchip).toBeNull();
    expect(card.qr.disponible).toBe(false);
    expect(card.contacto.whatsappUrl).toBeNull();
    expect(card.salud.vacunas).toEqual([]);
    expect(card.salud.desparasitaciones).toEqual([]);
    expect(card.salud.historialMedico).toEqual([]);
    expect(card.salud.veterinario).toBeNull();
    expect(card.emergencia.activo).toBe(false);
  });

  it("14. compatibilidad con perfiles actuales: todos los perfiles reales y demo construyen su carnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", APP_URL);
    const [pets, demo] = await Promise.all([getAllPets(), getAdoptionDemoPets()]);
    const todos = [...pets, ...demo];
    expect(todos.length).toBeGreaterThan(0);

    for (const pet of todos) {
      const card = buildCard(pet, { today: TODAY });
      expect(card.identificacion.codigoPublico).toBe(pet.identificacion.codigoPublico);
      expect(card.qr.disponible).toBe(true);
      expect(card.qr.url).toContain(pet.identificacion.codigoPublico);
      expect(card.qr.url).not.toContain(pet.id);
      expect(card.estado.perdido).toBe(pet.estado === "perdido");
      expect(card.estado.esTerminal).toBe(pet.estado === "fallecido");
      expect(card.emergencia.activo).toBe(pet.estado === "perdido");
    }
  });

  it("print: soporta los formatos definidos (tarjeta, credencial, placa/dije)", () => {
    const base = makePet();

    const tarjeta = buildCard(base, { formato: "tarjeta_imprimible", today: TODAY });
    expect(tarjeta.print).toEqual({ formato: "tarjeta_imprimible", orientacion: "vertical", qrMinimoMm: 25 });

    const credencial = buildCard(base, { formato: "credencial", today: TODAY });
    expect(credencial.print).toEqual({ formato: "credencial", orientacion: "horizontal", qrMinimoMm: 25 });

    const placa = buildCard(base, { formato: "placa_dije", today: TODAY });
    expect(placa.print).toEqual({ formato: "placa_dije", orientacion: "vertical", qrMinimoMm: 25 });
  });
});