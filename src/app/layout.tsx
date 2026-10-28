import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "./providers";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { PWA_THEME_COLOR } from "./manifest";
import { resolvePublicProfileBaseUrl } from "@/lib/publicProfileUrl";
import { LostDirectoryHistoryRefresh } from "@/components/pwa/LostDirectoryHistoryRefresh";

const siteUrl = (() => {
  const baseUrl = resolvePublicProfileBaseUrl();
  if (!baseUrl) {
    return new URL("http://localhost:3000");
  }
  try {
    return new URL(baseUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
})();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "PawPass | Carnet Digital",
  description: "Pasaporte digital público para mascotas con QR de emergencia.",
  applicationName: "PawPass",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PawPass",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "PawPass",
    locale: "es_MX",
  },
  twitter: {
    card: "summary",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='pawpass-theme:v1',v=localStorage.getItem(k)||localStorage.getItem('pawpass-theme');var dark=v? v==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;var d=document.documentElement;d.classList.toggle('dark',dark);d.style.colorScheme=dark?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LostDirectoryHistoryRefresh />
          {children}
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
