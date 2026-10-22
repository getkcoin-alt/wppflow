import type { MetadataRoute } from "next";
import { absolute, SITE } from "@/lib/site";

// Search engines and AI answer engines are welcome: being found and cited is the goal.
// They are named so the policy is explicit; "*" covers any crawler not listed.
const CRAWLERS = [
  "Googlebot", "Google-Extended", "Bingbot", "DuckDuckBot", "YandexBot", "Baiduspider", "Yeti", "SeznamBot", "Applebot", "Applebot-Extended",
  "OAI-SearchBot", "ChatGPT-User", "GPTBot", "Claude-SearchBot", "Claude-User", "ClaudeBot", "PerplexityBot", "Perplexity-User",
  "Amazonbot", "DuckAssistBot", "meta-externalagent", "MistralAI-User", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: CRAWLERS, allow: "/", disallow: ["/api/"] },
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: absolute("/sitemap.xml"),
    host: SITE.url,
  };
}
