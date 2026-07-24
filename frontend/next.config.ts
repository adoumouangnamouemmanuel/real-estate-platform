import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Property and developer media is served from Cloudinary — see docs/ARCHITECTURE.md §7.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // Baseline security headers, applied regardless of backend readiness — see
  // the Platform Readiness Review (docs/ARCHITECTURE.md) for the full context.
  // A real Content-Security-Policy is deliberately deferred: it needs to be
  // scoped against the real backend's origin and Cloudinary's asset domains
  // to avoid shipping either a broken or a meaninglessly permissive policy.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
