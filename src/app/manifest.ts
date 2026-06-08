import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestión Total Casa",
    short_name: "GTCasa",
    description: "Gestión financiera y operativa del hogar en formato PWA.",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#fbfaf7",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    categories: ["finance", "productivity", "utilities", "food"],
    lang: "es-CO",
    dir: "ltr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Compras",
        short_name: "Compras",
        description: "Abrir listas de mercado y conversión a stock.",
        url: "/compras?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Mercado",
        short_name: "Mercado",
        description: "Abrir Mercado, precios y stock.",
        url: "/mercado?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Gastos",
        short_name: "Gastos",
        description: "Registrar gastos manuales.",
        url: "/gastos?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
