import type { NextConfig } from "next";

// Provide a harmless fallback so optional Anthropic integrations
// that validate the API key don't crash the build when the variable
// is intentionally unset in this project.
if (!process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = "disabled";
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
