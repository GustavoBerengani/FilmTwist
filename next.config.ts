import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // AQUI ESTÁ O SEGREDO: Protegemos a biblioteca principal E o motor dela
    serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
};

export default nextConfig;