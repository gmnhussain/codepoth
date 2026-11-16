/**
 * The page routes a build pre-rendered with HTML, and where that HTML is
 * (ADR-0016). The build adapter (`search-index-adapter.ts`) takes them from
 * Next's adapter API, which gives each pre-rendered page's file, and writes
 * them to `.next/prerendered-pages.json`. The search index, the end-to-end
 * tests and the Lighthouse script read that file. Where Next puts the HTML
 * depends on the build (with an adapter it is under a hashed folder), so
 * nothing builds the path itself.
 */
import { readFileSync } from "node:fs"
import path from "node:path"

/** The file the page list is written to, in the dist dir. */
export const PAGES_FILE = "prerendered-pages.json"

/** A pre-rendered page: its route and its HTML file, relative to the dist dir. */
export type PrerenderedPage = {
  readonly route: string
  readonly file: string
}

/** The fields of an adapter prerender output this module reads. */
export type PrerenderOutput = {
  readonly pathname: string
  readonly routeType?: string | undefined
  readonly htmlSize?: number | undefined
  readonly fallback?: { readonly filePath?: string | undefined } | undefined
}

/**
 * The page routes with HTML among a build's prerender outputs, sorted, with
 * their HTML files relative to the dist dir. Route handlers, metadata files,
 * RSC and segment outputs, and empty shells are left out. Throws, naming the
 * route, when a page with HTML has no file: the index must never miss a
 * page without saying so.
 */
export function pagesFromPrerenders(
  prerenders: readonly PrerenderOutput[],
  distDir: string
): PrerenderedPage[] {
  return prerenders
    .filter(
      (output) =>
        output.routeType === "page" &&
        typeof output.htmlSize === "number" &&
        output.htmlSize > 0
    )
    .map((output) => {
      const filePath = output.fallback?.filePath
      if (filePath === undefined) {
        throw new Error(`${output.pathname}: Next gave no HTML file`)
      }
      return {
        route: output.pathname,
        file: path.relative(distDir, filePath).split(path.sep).join("/"),
      }
    })
    .sort((a, b) => (a.route < b.route ? -1 : a.route > b.route ? 1 : 0))
}

/** The page list as written to {@link PAGES_FILE}. */
export function serializePages(pages: readonly PrerenderedPage[]): string {
  return `${JSON.stringify({ pages }, null, 2)}\n`
}

/** The page list read back from {@link PAGES_FILE}'s text. */
export function parsePages(text: string): PrerenderedPage[] {
  const parsed: unknown = JSON.parse(text)
  const pages =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { pages?: unknown }).pages
      : undefined
  if (
    !Array.isArray(pages) ||
    !pages.every(
      (page: unknown) =>
        typeof page === "object" &&
        page !== null &&
        typeof (page as { route?: unknown }).route === "string" &&
        typeof (page as { file?: unknown }).file === "string"
    )
  ) {
    throw new Error(`${PAGES_FILE} does not hold a page list`)
  }
  return pages as PrerenderedPage[]
}

/** The page list of the build in a dist dir. */
export function readBuiltPages(distDir: string): PrerenderedPage[] {
  return parsePages(readFileSync(path.join(distDir, PAGES_FILE), "utf8"))
}

/** A route's pre-rendered HTML in the build in a dist dir. */
export function readBuiltHtml(distDir: string, route: string): string {
  const page = readBuiltPages(distDir).find((p) => p.route === route)
  if (page === undefined) throw new Error(`${route} is not a built page`)
  return readFileSync(path.join(distDir, page.file), "utf8")
}
