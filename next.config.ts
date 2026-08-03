import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, Turbopack walks up and finds an
  // unrelated lockfile in the parent directory and infers the wrong root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
