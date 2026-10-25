import { redirect } from "next/navigation";

type AdoptionPageProps = { params: Promise<{ id: string }> };

export default async function LegacyAdoptionRequestPage({ params }: AdoptionPageProps) {
  const { id } = await params;
  redirect(`/adopciones/${encodeURIComponent(id)}`);
}
