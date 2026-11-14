import { createContentCollectionPlugin } from "@content-collections/next"
import type { NextConfig } from "next"

/** Two years, the value the HSTS preload list expects (no preload requested). */
const HSTS_MAX_AGE_SECONDS = 63_072_000

/**
 * Fixed security headers on every path (conventions §13, ADR-0004). A
 * Content-Security-Policy is added once third-party scripts arrive.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: `max-age=${String(HSTS_MAX_AGE_SECONDS)}; includeSubDomains`,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // The site uses none of these; browsing-topics also opts out of the
    // Topics API, in line with "no tracking" (ADR-0001).
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: [
    "@workspace/ui",
    "@workspace/config",
    "@workspace/content",
  ],
  headers() {
    return Promise.resolve([{ source: "/:path*", headers: SECURITY_HEADERS }])
  },
}

// Content lives in packages/content (ADR-0005). The `content:generate` task
// builds it before `next build`; this plugin rebuilds and watches it during
// `next dev`.
const withContentCollections = createContentCollectionPlugin({
  configPath: "../../packages/content/content-collections.ts",
})

export default withContentCollections(nextConfig)
