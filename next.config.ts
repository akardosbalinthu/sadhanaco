import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Megszűnt oldalak (2026. november 25., docs/KONCEPCIO.md)
      { source: "/napi-kozlony", destination: "/", permanent: false },
      { source: "/tura-meghivo", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
