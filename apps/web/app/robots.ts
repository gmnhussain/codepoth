import type { MetadataRoute } from "next"

/**
 * Every page is public. The sitemap line is added with sitemap.ts, once the
 * pages it lists exist (conventions §12).
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } }
}
