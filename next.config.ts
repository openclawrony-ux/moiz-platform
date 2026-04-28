import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Bundle the system prompt with the /api/generate route so
  // `fs.readFileSync(process.cwd() + "/prompts/system.v1.md")` works on Vercel.
  outputFileTracingIncludes: {
    "/api/generate": ["./prompts/**/*"],
  },
};

export default nextConfig;
