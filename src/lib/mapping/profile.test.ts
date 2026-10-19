import { describe, expect, it } from "vitest";
import { toProfileViewModel } from "@/lib/mapping/profile";
import type { PetProfile, PetVaccine } from "@/types/pet";

function buildPet(status: PetProfile["estado"], vacunas: PetVaccine[] = []): PetProfile {
  return {
    id: "test-1",
    estado: status,
    verificado: true,
    mascota: {
      nombre: "Prueba",
      especie: "Perro",
      raza: "Poodle",
      fotoPerfilUrl: "/pets/prueba.jpeg",
      genero: "Macho",
      talla: "Pequeño",
      color: "Negro",
      pesoKg: 8,
      fechaNacimiento: "2020-01-01",
      rasgosDistintivos: ["Mancha blanca"],
      esterilizado: true,
    },
    identificacion: { codigoPublico: "PC-TEST-001", microchip: null, notas: "" },
    contacto: {
      nombrePublico: "Dueño",
      telefonoPrincipal: "5551234567",
      whatsapp: "5215551234567",
      telefonoSecundario: "",
      email: "",
      zonaSegura: "Colonia Centro",
      zonaHabitual: "Parque",
      mensajeWhatsapp: "Encontré a Prueba",
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
    vacunas,
    documentos: [],
    configuracionPublica: {
      mostrarEmail: false,
      mostrarTelefonoSecundario: false,
      mostrarDireccionVet: false,
      mostrarDocumentosPrivados: false,
    },
  };
}

describe("toProfileViewModel", () => {
  it("expone el estado canónico en_casa", () => {
    const vm = toProfileViewModel(buildPet("en_casa"));
    expect(vm.status).toBe("en_casa");
  });

  it("expone el estado canónico perdido", () => {
    const vm = toProfileViewModel(buildPet("perdido"));
    expect(vm.status).toBe("perdido");
  });

  it("expone estados futuros del ciclo de vida sin romper el mapeo", () => {
    const vm = toProfileViewModel(buildPet("en_adopcion"));
    expect(vm.status).toBe("en_adopcion");
    expect(vm.header.name).toBe("Prueba");
  });

  it("expone sin romper el mapeo todos los estados del ciclo de vida", () => {
    const statuses: PetProfile["estado"][] = [
      "en_casa",
      "perdido",
      "en_adopcion",
      "adoptado",
      "rescatado",
      "fallecido",
    ];

    for (const status of statuses) {
      const vm = toProfileViewModel(buildPet(status));
      expect(vm.status).toBe(status);
      expect(vm.header.name).toBe("Prueba");
    }
  });

  describe("evaluación calendárica del estatus de vacunas en el header", () => {
    it("reporta 'Al día' cuando no hay vacunas registradas", () => {
      const vm = toProfileViewModel(buildPet("en_casa", []));
      expect(vm.header.status.vaccines).toBe("Al día");
    });

    it("reporta 'Al día' cuando todas las próximas dosis son futuras", () => {
      const vm = toProfileViewModel(
        buildPet("en_casa", [
          {
            id: "v-1",
            nombre: "Rabia",
            fechaAplicacion: "2026-01-01",
            proximaDosis: "2099-01-01",
            estatus: "al_dia",
            lote: "L-1",
            veterinario: "Vet",
            documentoUrl: "/doc.pdf",
          },
        ]),
      );
      expect(vm.header.status.vaccines).toBe("Al día");
    });

    it("reporta 'Revisar' cuando una vacuna está vencida por estatus explícito", () => {
      const vm = toProfileViewModel(
        buildPet("en_casa", [
          {
            id: "v-1",
            nombre: "Rabia",
            fechaAplicacion: "2024-01-01",
            proximaDosis: "2099-01-01",
            estatus: "vencida",
            lote: "L-1",
            veterinario: "Vet",
            documentoUrl: "/doc.pdf",
          },
        ]),
      );
      expect(vm.header.status.vaccines).toBe("Revisar");
    });

    it("reporta 'Revisar' cuando la próxima dosis ya pasó, aunque el estatus diga 'al_dia'", () => {
      const vm = toProfileViewModel(
        buildPet("en_casa", [
          {
            id: "v-1",
            nombre: "Rabia",
            fechaAplicacion: "2024-01-01",
            proximaDosis: "2024-06-01",
            estatus: "al_dia", // dato estático desactualizado
            lote: "L-1",
            veterinario: "Vet",
            documentoUrl: "/doc.pdf",
          },
        ]),
      );
      expect(vm.header.status.vaccines).toBe("Revisar");
    });
  });
});
