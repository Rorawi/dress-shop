import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Charwin Stores",
    short_name: "Charwin Stores",
    description: "Clothing and intimates, selected with care.",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFBFD",
    theme_color: "#55239A",
    icons: [
      {
        src: "/brand/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
