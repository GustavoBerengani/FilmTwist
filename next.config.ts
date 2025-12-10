import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isso avisa o Next.js para não "quebrar" a biblioteca de IA ao subir para a Vercel
  serverExternalPackages: ['@xenova/transformers'],
};

export default nextConfig;