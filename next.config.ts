import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/process": ["./templates/**/*", "./fixtures/**/*"],
    "/api/export": ["./templates/**/*"],
  },
};

export default nextConfig;
