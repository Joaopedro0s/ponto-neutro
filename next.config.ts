import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem o selo de desenvolvimento do Next.js na tela (aparecia nas capturas).
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
