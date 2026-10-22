import type { MetadataRoute } from "next";
import { absolute } from "@/lib/site";
import { allRoutes } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes().map((r) => ({
    url: absolute(r.path),
    priority: r.priority,
    ...(r.modified ? { lastModified: r.modified } : {}),
  }));
}
