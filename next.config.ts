import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from walking up to unrelated lockfiles in a parent workspace.
    root: __dirname,
  },
  images: {
    // Allow local /uploads/ images served from public/ without domain restrictions
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
