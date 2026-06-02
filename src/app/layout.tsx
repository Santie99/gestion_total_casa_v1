import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión Total Casa",
  description: "PWA para gestión financiera y operativa del hogar",
  applicationName: "Gestión Total Casa",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Gestión Total Casa",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
