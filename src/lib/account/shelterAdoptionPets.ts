export type ShelterAdoptionPet = {
  id: string;
  publicCode: string;
  name: string;
  species: "Perro" | "Gato";
  status: "en_casa" | "en_adopcion";
};

export function normalizeShelterAdoptionPets(data: unknown): ShelterAdoptionPet[] {
  if (!Array.isArray(data)) return [];
  const pets: ShelterAdoptionPet[] = [];
  for (const value of data) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const publicCode = typeof row.publicCode === "string" ? row.publicCode.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const species = row.species === "Perro" || row.species === "Gato" ? row.species : null;
    const status = row.status === "en_casa" || row.status === "en_adopcion" ? row.status : null;
    if (!id || !publicCode || !name || !species || !status) continue;
    pets.push({ id, publicCode, name, species, status });
  }
  return pets;
}
