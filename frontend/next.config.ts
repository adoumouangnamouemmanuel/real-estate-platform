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
};

export default nextConfig;
