import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["pdfjs-dist"],
  async redirects() {
    return [
      { source: "/login", destination: "/", permanent: false },
      { source: "/signup", destination: "/", permanent: false },
      { source: "/onboarding", destination: "/dashboard", permanent: false },
      { source: "/billing", destination: "/settings", permanent: false },
      { source: "/guide", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
