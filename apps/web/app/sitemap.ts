import type { MetadataRoute } from "next"
import { notFound } from "next/navigation"

import { site } from "@workspace/config/site"
import { getAboutPage, getContentGraph } from "@workspace/content/content"
import { isIndexableBuild } from "@workspace/content/env"
import { contentSitemapEntries } from "@workspace/content/sitemap"

import { NAV_ROUTES } from "@/lib/routes"

/**
 * The sitemap, only in an indexable build (a production deploy without
 * drafts); any other build answers 404, and robots.txt does not mention it
 * (conventions §12). It lists the indexable header pages, About when published, topics
 * with a published lesson and published lessons — never a draft or
 * /dashboard.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexableBuild(process.env)) notFound()
  const absolute = (path: string) => new URL(path, site.url).href
  const pages = [
    ...NAV_ROUTES.filter((route) => route.indexable).map((route) => ({
      path: route.href,
    })),
    ...(getAboutPage() === undefined ? [] : [{ path: "/about" }]),
  ]
  return [
    ...pages.map((page) => ({ url: absolute(page.path) })),
    ...contentSitemapEntries(getContentGraph()).map((entry) => ({
      url: absolute(entry.path),
      ...(entry.lastModified === undefined
        ? {}
        : { lastModified: entry.lastModified }),
    })),
  ]
}
