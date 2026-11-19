import type { NextConfig } from "next";

const config: NextConfig = {
  // The worker keeps running between requests; this is a local app, not a serverless deploy.
  devIndicators: false,
};

export default config;
