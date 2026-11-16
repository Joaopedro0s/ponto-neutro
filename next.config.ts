import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem o selo de desenvolvimento do Next.js na tela (aparecia nas capturas).
  devIndicators: false,
  // Fontes do PDF são lidas do disco em tempo de execução; garante que vão junto no deploy.
  outputFileTracingIncludes: {
    "/compartilhar/orcamento/[token]": ["./node_modules/@fontsource/{barlow-condensed,geist-sans,jetbrains-mono}/files/*-latin-*-normal.woff"],
  },
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
