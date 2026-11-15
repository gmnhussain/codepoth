/**
 * Builds the Pagefind search index from the pages this `next build` has just
 * pre-rendered, and writes it to `public/pagefind` (ADR-0015). Runs right
 * after `next build` in this app's `build` script, with Node's own
 * TypeScript support: `node scripts/build-search-index.ts`.
 *
 * Only this build's routes are read (from `prerender-manifest.json`), so a
 * page left over from an earlier build never reaches the index, and a build
 * without drafts indexes no draft. Only pages that mark content with
 * `data-pagefind-body` are indexed.
 */
import { readFile, rm } from "node:fs/promises"
import path from "node:path"

import * as pagefind from "pagefind"

// With its extension: Node runs this file directly and does not resolve
// extensionless imports.
import { normalizeSearchText } from "../lib/search/search-text.ts"

/** The attribute that marks a page's indexable content (ADR-0015). */
export const BODY_MARKER = "data-pagefind-body"

/** Where the bundle is written, relative to the app; served at `/pagefind/`. */
export const OUTPUT_DIR = path.join("public", "pagefind")

const DIST_DIR = ".next"

/**
 * Left out of every page's words: what assistive technology skips as
 * decoration (section numbers, avatar initials, separators, the copy
 * button's text) is not searchable text either. Without this, a number
 * fused with the next word ("০১ধারণা") would be indexed as one word.
 */
export const EXCLUDE_SELECTORS = ['[aria-hidden="true"]']

/** The fields of a prerender-manifest route entry this script reads. */
type ManifestRoute = {
  readonly routeType?: string
  readonly htmlSize?: number
}

/**
 * The page routes a build pre-rendered with HTML, sorted, from the parsed
 * `prerender-manifest.json`. Route handlers, metadata files and empty
 * shells are left out.
 */
export function prerenderedPageRoutes(manifest: unknown): string[] {
  if (typeof manifest !== "object" || manifest === null) return []
  const routes = (manifest as { routes?: unknown }).routes
  if (typeof routes !== "object" || routes === null) return []
  return Object.entries(routes as Record<string, ManifestRoute>)
    .filter(
      ([, route]) =>
        route.routeType === "page" &&
        typeof route.htmlSize === "number" &&
        route.htmlSize > 0
    )
    .map(([route]) => route)
    .sort()
}

/** The pre-rendered HTML file of a route, relative to the dist dir. */
export function htmlPathOf(route: string): string {
  const name = route === "/" ? "/index" : route
  return path.join("server", "app", `${name}.html`)
}

/** Whether a page marks content for the index. */
export function hasIndexableBody(html: string): boolean {
  return html.includes(BODY_MARKER)
}

function fail(message: string): never {
  process.stderr.write(`search index: ${message}\n`)
  process.exit(1)
}

async function main() {
  const manifestPath = path.join(DIST_DIR, "prerender-manifest.json")
  const manifest: unknown = JSON.parse(await readFile(manifestPath, "utf8"))
  const routes = prerenderedPageRoutes(manifest)

  await rm(OUTPUT_DIR, { recursive: true, force: true })
  const { index, errors } = await pagefind.createIndex({
    excludeSelectors: EXCLUDE_SELECTORS,
  })
  if (index === undefined) fail(errors.join("\n"))

  let pages = 0
  let words = 0
  for (const route of routes) {
    const html = await readFile(path.join(DIST_DIR, htmlPathOf(route)), "utf8")
    if (!hasIndexableBody(html)) continue
    const added = await index.addHTMLFile({
      url: route,
      // The dialog normalises the query the same way.
      content: normalizeSearchText(html),
    })
    if (added.errors.length > 0) fail(`${route}: ${added.errors.join("\n")}`)
    pages += 1
    words += added.file.uniqueWords
  }
  if (pages === 0) {
    fail(`no page has ${BODY_MARKER}; checked ${String(routes.length)} routes`)
  }

  const written = await index.writeFiles({ outputPath: OUTPUT_DIR })
  if (written.errors.length > 0) fail(written.errors.join("\n"))
  await pagefind.close()

  process.stdout.write(
    `search index: ${String(pages)} of ${String(routes.length)} pages, ${String(words)} unique words → ${OUTPUT_DIR}\n`
  )
}

if (import.meta.main) await main()
