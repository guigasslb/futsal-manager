import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mister",
    short_name: "Mister",
    description: "Gestão de treino e desenvolvimento do atleta, para futsal e futebol",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EDEBE7",
    theme_color: "#141210",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    lang: "pt-PT",
  };
}
