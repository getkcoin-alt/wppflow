import type { NextConfig } from "next";

// The contact form posts to /api/public/contact on this site; Vercel forwards it to the
// Scriwo backend, so the browser never needs a cross-site request.
const BACKEND_URL = (process.env.BACKEND_URL || "https://srv1628639.hstgr.cloud").replace(/\/+$/, "");

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://app.scriwo.com").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  // Invitation and set-password emails sent before the app moved to app.scriwo.com link to
  // https://scriwo.com/?invite=...; send them to the app so those links keep working.
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "invite" }],
        destination: `${APP_URL}/`,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/public/:path*", destination: `${BACKEND_URL}/api/public/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
