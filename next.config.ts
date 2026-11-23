import type { NextConfig } from "next";

const config: NextConfig = {};

if (process.env.MEDILENS_STATIC_EXPORT === "1") {
  config.output = "export";
  config.trailingSlash = true;
  config.images = { unoptimized: true };
}

export default config;
