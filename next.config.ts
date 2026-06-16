import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Aplica a correção apenas em modo de desenvolvimento
    if (dev) {
      config.watchOptions = {
        poll: 1000,        // Verifica mudanças a cada 1 segundo em vez de usar o watcher do Windows
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;