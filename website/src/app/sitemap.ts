import type { MetadataRoute } from "next";
import { absolute } from "@/lib/site";
import { allRoutes } from "@/lib/routes";
import { LANGUAGE_ALTERNATES } from "@/content/locales";

const LANGUAGE_PAGES = new Set(Object.values(LANGUAGE_ALTERNATES));
const languages = Object.fromEntries(Object.entries(LANGUAGE_ALTERNATES).map(([k, v]) => [k, absolute(v)]));

export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes().map((r) => ({
    url: absolute(r.path),
    priority: r.priority,
    ...(r.modified ? { lastModified: r.modified } : {}),
    ...(LANGUAGE_PAGES.has(r.path) ? { alternates: { languages } } : {}),
  }));
}
