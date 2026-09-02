import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Property and developer media is served from Cloudinary in production — see docs/ARCHITECTURE.md §7.
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Demo/mock property photography only (services/mocks/properties.mock.ts) —
      // real, licensed Unsplash photography standing in for real listings until
      // real developer-uploaded media exists. Never a production image source.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  // Baseline security headers, applied regardless of backend readiness — see
  // the Platform Readiness Review (docs/ARCHITECTURE.md) for the full context.
  // A real Content-Security-Policy is deliberately deferred: it needs to be
  // scoped against the real backend's origin and Cloudinary's asset domains
  // to avoid shipping either a broken or a meaninglessly permissive policy.
  async redirects() {
    return [
      // The (dashboard) route group in Next.js doesn't add /dashboard to the URL.
      // These redirects let users navigate to /dashboard/listings, /dashboard/appointments, etc.
      // and land on the correct pages at /listings, /appointments, etc.
      {
        source: "/dashboard/listings",
        destination: "/listings",
        permanent: false,
      },
      {
        source: "/dashboard/listings/:path*",
        destination: "/listings/:path*",
        permanent: false,
      },
      {
        source: "/dashboard/appointments",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/dashboard/appointments/:path*",
        destination: "/appointments/:path*",
        permanent: false,
      },
      {
        source: "/dashboard/analytics",
        destination: "/analytics",
        permanent: false,
      },
      {
        source: "/dashboard/notifications",
        destination: "/notifications",
        permanent: false,
      },
    ];
  },

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
