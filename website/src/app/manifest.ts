import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scriwo",
    short_name: "Scriwo",
    description: "The shared WhatsApp inbox for teams",
    start_url: "/",
    display: "browser",
    background_color: "#08090a",
    theme_color: "#08090a",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
