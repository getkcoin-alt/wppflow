import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scriwo",
    short_name: "Scriwo",
    description: "The shared WhatsApp inbox for teams",
    start_url: "/",
    display: "browser",
    background_color: "#fbfaf7",
    theme_color: "#fbfaf7",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/scriwo-mark-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
