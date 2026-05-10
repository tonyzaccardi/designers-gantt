import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/designers-gantt",
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: "/designers-gantt" },
};

export default nextConfig;
