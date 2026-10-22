import { FEATURES } from "@/content/features";
import { INDUSTRIES } from "@/content/industries";
import { CITIES } from "@/content/cities";
import { COMPARISONS } from "@/content/compare";
import { POSTS } from "@/content/blog";

/** Every public page, used by the sitemap, llms.txt and the route tests. */
export type Route = { path: string; priority: number; modified?: string };

export function allRoutes(): Route[] {
  return [
    { path: "/", priority: 1 },
    { path: "/features", priority: 0.9 },
    { path: "/pricing", priority: 0.9 },
    { path: "/contact", priority: 0.9 },
    { path: "/industries", priority: 0.8 },
    { path: "/whatsapp-crm", priority: 0.8 },
    { path: "/free-whatsapp-crm", priority: 0.8 },
    { path: "/compare", priority: 0.6 },
    { path: "/security", priority: 0.7 },
    { path: "/developers", priority: 0.7 },
    { path: "/about", priority: 0.5 },
    { path: "/blog", priority: 0.7 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
    ...FEATURES.map((f) => ({ path: `/features/${f.slug}`, priority: 0.8 })),
    ...INDUSTRIES.map((i) => ({ path: `/industries/${i.slug}`, priority: 0.8 })),
    ...CITIES.map((c) => ({ path: `/whatsapp-crm/${c.slug}`, priority: 0.7 })),
    ...COMPARISONS.map((c) => ({ path: `/compare/${c.slug}`, priority: 0.6 })),
    ...POSTS.map((p) => ({ path: `/blog/${p.slug}`, priority: 0.6, modified: p.updated || p.published })),
  ];
}
