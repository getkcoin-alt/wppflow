import type { MetadataRoute } from "next";
import { absolute, SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Search and AI answer engines are welcome: being cited is the goal.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: absolute("/sitemap.xml"),
    host: SITE.url,
  };
}
