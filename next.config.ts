import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
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
