import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimise production builds
  reactStrictMode: true,

  // Allow external image sources (map tiles, etc.)
  images: {
    unoptimized: true,
  },

  // Headers for the service worker and PWA
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
