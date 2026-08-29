import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Standalone output for a minimal, self-contained Docker runtime image
  // (see infra/Dockerfile) — irrelevant to the default Vercel deployment,
  // which ignores this setting.
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
}

export default nextConfig
