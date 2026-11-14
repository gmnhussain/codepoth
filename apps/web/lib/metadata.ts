import type { Metadata } from "next"

import { site } from "@workspace/config/site"

/** What every indexable page passes to `buildPageMetadata` (conventions §12). */
export type PageMetadataInput = {
  readonly title: string
  readonly description: string
  /** Path of the page, e.g. "/roadmap"; becomes the canonical URL. */
  readonly path: string
}

/** Title, description, canonical URL and Open Graph for one page. */
export function buildPageMetadata({
  title,
  description,
  path,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: site.name.bn,
      locale: "bn_BD",
      type: "website",
    },
  }
}
