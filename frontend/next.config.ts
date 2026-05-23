import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose the backend URL to the browser bundle
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  },
  // Empty turbopack config to silence the webpack-config warning
  // Mermaid is imported dynamically inside useEffect, so no SSR issues
  turbopack: {},
};

export default nextConfig;
