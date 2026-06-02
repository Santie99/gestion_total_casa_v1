import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestión Total Casa",
    short_name: "GTCasa",
    description: "Gestión financiera y operativa del hogar en formato PWA.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    orientation: "portrait",
    categories: ["finance", "productivity", "utilities"],
  };
}
