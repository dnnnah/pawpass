export type PetContact = {
  publicName: string;
  phone: string;
  whatsapp: string;
  secondaryPhone: string;
  email: string;
  safeZone: string;
  usualZone: string;
  whatsappMessage: string;
};

export type PetPrivacy = {
  published: boolean;
  showContactName: boolean;
  showPhone: boolean;
  showWhatsapp: boolean;
  showSecondaryPhone: boolean;
  showEmail: boolean;
  showZone: boolean;
  showHealth: boolean;
  showVeterinarian: boolean;
  showVetAddress: boolean;
  showEmergency: boolean;
  showMicrochip: boolean;
  listInCatalog: boolean;
};

export type PetSettings = {
  contact: PetContact;
  privacy: PetPrivacy;
};

export type PetSettingsResult = PetSettings & { error: string | null };

type QueryResult = {
  data: unknown;
  error: { message?: string } | null;
};

type PetSettingsQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<QueryResult>;
    };
  };
};

type PetSettingsUpdate = {
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<QueryResult>;
  };
};

export type PetSettingsClient = {
  from: (table: "pet_contacts" | "pet_privacy") => PetSettingsQuery & PetSettingsUpdate;
};

const emptyContact: PetContact = {
  publicName: "",
  phone: "",
  whatsapp: "",
  secondaryPhone: "",
  email: "",
  safeZone: "",
  usualZone: "",
  whatsappMessage: "",
};

const emptyPrivacy: PetPrivacy = {
  published: false,
  showContactName: false,
  showPhone: false,
  showWhatsapp: false,
  showSecondaryPhone: false,
  showEmail: false,
  showZone: false,
  showHealth: false,
  showVeterinarian: false,
  showVetAddress: false,
  showEmergency: false,
  showMicrochip: false,
  listInCatalog: false,
};

const LOAD_ERROR = "No pudimos cargar la configuración de la ficha.";
const SAVE_ERROR = "No pudimos guardar los cambios. Revisa los datos e intenta de nuevo.";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function boolean(value: unknown): boolean {
  return value === true;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export function normalizePetContact(value: unknown): PetContact {
  const row = record(value);
  return {
    publicName: text(row.nombre_publico),
    phone: text(row.telefono_principal),
    whatsapp: text(row.whatsapp),
    secondaryPhone: text(row.telefono_secundario),
    email: text(row.email),
    safeZone: text(row.zona_segura),
    usualZone: text(row.zona_habitual),
    whatsappMessage: text(row.mensaje_whatsapp),
  };
}

export function normalizePetPrivacy(value: unknown): PetPrivacy {
  const row = record(value);
  return {
    published: boolean(row.publicado),
    showContactName: boolean(row.mostrar_nombre_contacto),
    showPhone: boolean(row.mostrar_telefono),
    showWhatsapp: boolean(row.mostrar_whatsapp),
    showSecondaryPhone: boolean(row.mostrar_telefono_secundario),
    showEmail: boolean(row.mostrar_email),
    showZone: boolean(row.mostrar_zona),
    showHealth: boolean(row.mostrar_salud),
    showVeterinarian: boolean(row.mostrar_veterinario),
    showVetAddress: boolean(row.mostrar_direccion_vet),
    showEmergency: boolean(row.mostrar_emergencia),
    showMicrochip: boolean(row.mostrar_microchip),
    listInCatalog: boolean(row.listar_catalogo),
  };
}

export async function loadPetSettings(
  client: PetSettingsClient,
  petId: string,
): Promise<PetSettingsResult> {
  try {
    const [contactResponse, privacyResponse] = await Promise.all([
      client
        .from("pet_contacts")
        .select("nombre_publico, telefono_principal, whatsapp, telefono_secundario, email, zona_segura, zona_habitual, mensaje_whatsapp")
        .eq("pet_id", petId)
        .maybeSingle(),
      client
        .from("pet_privacy")
        .select("publicado, mostrar_nombre_contacto, mostrar_telefono, mostrar_whatsapp, mostrar_telefono_secundario, mostrar_email, mostrar_zona, mostrar_salud, mostrar_veterinario, mostrar_direccion_vet, mostrar_emergencia, mostrar_microchip, listar_catalogo")
        .eq("pet_id", petId)
        .maybeSingle(),
    ]);

    if (contactResponse.error || privacyResponse.error) {
      return { contact: { ...emptyContact }, privacy: { ...emptyPrivacy }, error: LOAD_ERROR };
    }

    return {
      contact: normalizePetContact(contactResponse.data),
      privacy: normalizePetPrivacy(privacyResponse.data),
      error: null,
    };
  } catch {
    return { contact: { ...emptyContact }, privacy: { ...emptyPrivacy }, error: LOAD_ERROR };
  }
}

export async function updatePetContact(
  client: PetSettingsClient,
  petId: string,
  contact: PetContact,
): Promise<string | null> {
  try {
    const { error } = await client
      .from("pet_contacts")
      .update({
        nombre_publico: contact.publicName.trim() || null,
        telefono_principal: contact.phone.trim() || null,
        whatsapp: contact.whatsapp.trim() || null,
        telefono_secundario: contact.secondaryPhone.trim() || null,
        email: contact.email.trim() || null,
        zona_segura: contact.safeZone.trim() || null,
        zona_habitual: contact.usualZone.trim() || null,
        mensaje_whatsapp: contact.whatsappMessage.trim() || null,
      })
      .eq("pet_id", petId);

    return error ? SAVE_ERROR : null;
  } catch {
    return SAVE_ERROR;
  }
}

export async function updatePetPrivacy(
  client: PetSettingsClient,
  petId: string,
  privacy: PetPrivacy,
): Promise<string | null> {
  try {
    const { error } = await client
      .from("pet_privacy")
      .update({
        publicado: privacy.published,
        mostrar_nombre_contacto: privacy.showContactName,
        mostrar_telefono: privacy.showPhone,
        mostrar_whatsapp: privacy.showWhatsapp,
        mostrar_telefono_secundario: privacy.showSecondaryPhone,
        mostrar_email: privacy.showEmail,
        mostrar_zona: privacy.showZone,
        mostrar_salud: privacy.showHealth,
        mostrar_veterinario: privacy.showVeterinarian,
        mostrar_direccion_vet: privacy.showVetAddress,
        mostrar_emergencia: privacy.showEmergency,
        mostrar_microchip: privacy.showMicrochip,
        listar_catalogo: privacy.listInCatalog,
      })
      .eq("pet_id", petId);

    return error ? SAVE_ERROR : null;
  } catch {
    return SAVE_ERROR;
  }
}
