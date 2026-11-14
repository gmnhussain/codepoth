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
  // Moved lessons: every `previousSlugs` entry is a permanent redirect to the
  // lesson's current URL (ADR-0004, ADR-0006). Imported here, not at the top,
  // so the config loads before content is generated; by the time Next asks
  // for redirects, `content:generate` (build) or the plugin below (dev) has
  // written it.
  async redirects() {
    const [{ allLessons }, { contentOptionsFrom }, { lessonRedirects }] =
      await Promise.all([
        import("@workspace/content/generated"),
        import("@workspace/content/env"),
        import("@workspace/content/redirects"),
      ])
    return lessonRedirects(allLessons, contentOptionsFrom(process.env))
  },
}

// Content lives in packages/content (ADR-0005). The `content:generate` task
// builds it before `next build`; this plugin rebuilds and watches it during
// `next dev`.
const withContentCollections = createContentCollectionPlugin({
  configPath: "../../packages/content/content-collections.ts",
})

export default withContentCollections(nextConfig)
