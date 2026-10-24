import type { MetadataRoute } from "next";

type ShareManifest = MetadataRoute.Manifest & {
  share_target: {
    action: string;
    method: "POST";
    enctype: "multipart/form-data";
    params: { title: string; text: string; url: string; files: { name: string; accept: string[] }[] };
  };
};

export default function manifest(): ShareManifest {
  return {
    name: "Charwin Stores",
    short_name: "Charwin Stores",
    description: "Clothing, intimates, bags, and shoes, selected with care.",
    start_url: "/",
    id: "/",
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
    share_target: {
      action: "/api/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [{ name: "files", accept: ["image/jpeg", "image/png", "image/webp"] }],
      },
    },
  } as ShareManifest;
}
