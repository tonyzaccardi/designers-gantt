import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/designers-gantt",
  images: { unoptimized: true },
};

export default nextConfig;
