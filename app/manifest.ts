import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Yulaverse Studio",
    short_name: "Yulaverse",
    description:
      "Distinctive brand identities, premium websites and digital experiences.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0C0F15",
    theme_color: "#0C0F15",
    categories: ["design", "business"],
    icons: [
      {
        src: "/icons/yulaverse-light-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/yulaverse-light-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/yulaverse-light-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
