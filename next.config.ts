import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/anki-stats",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
