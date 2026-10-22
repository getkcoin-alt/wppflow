import type { NextConfig } from "next";

// The contact form posts to /api/public/contact on this site; Vercel forwards it to the
// Scriwo backend, so the browser never needs a cross-site request.
const BACKEND_URL = (process.env.BACKEND_URL || "https://srv1628639.hstgr.cloud").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
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
