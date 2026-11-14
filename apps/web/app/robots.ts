import type { MetadataRoute } from "next"

import { site } from "@workspace/config/site"
import { isIndexableBuild } from "@workspace/content/env"

/**
 * Crawling is always allowed. A non-indexable build (preview, local, drafts)
 * is kept out of search results by the `noindex, nofollow` in the root
 * metadata, which a crawler only sees if robots.txt lets it fetch the page
 * (conventions §12). The sitemap line appears only in an indexable build,
 * the only build that has a sitemap (sitemap.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(isIndexableBuild(process.env)
      ? { sitemap: new URL("/sitemap.xml", site.url).href }
      : {}),
  }
}
