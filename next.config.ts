import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
