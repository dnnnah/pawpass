import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { HomeSectionLinks } from "@/components/features/home/HomeSectionLinks";

export const metadata: Metadata = {
  title: "Mascotas | PawPass",
  description: "Elige una sección de PawPass: tus mascotas, alertas perdidas, perfiles públicos o adopciones.",
};

export default function Home() {
  return <AppShell><HomeSectionLinks /></AppShell>;
}
