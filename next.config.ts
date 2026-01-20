import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    // Optimize barrel imports for lucide-react to reduce bundle size
    // This transforms `import { X } from "lucide-react"` to individual imports
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
