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
  // Debug logging is stripped via logger utility and dead code elimination
  // The logger checks process.env.NODE_ENV which is replaced at build time
};

export default nextConfig;
