import type { MetadataRoute } from "next"

/**
 * Crawling is always allowed. A non-indexable build (preview, local, drafts)
 * is kept out of search results by the `noindex, nofollow` in the root
 * metadata, which a crawler only sees if robots.txt lets it fetch the page
 * (conventions §12). The sitemap line is added with sitemap.ts, and only in
 * an indexable build.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } }
}
