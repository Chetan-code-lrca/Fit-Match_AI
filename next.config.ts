import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow local /uploads/ images served from public/ without domain restrictions
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
