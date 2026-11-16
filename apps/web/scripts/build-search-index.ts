/**
 * Builds the Pagefind search index from the pages a `next build` has just
 * pre-rendered, and writes it to `public/pagefind` (ADR-0015, ADR-0016). The
 * build adapter (`search-index-adapter.ts`) calls it inside `next build`,
 * before a deployment adapter copies `public/`.
 *
 * Only this build's pages are read (the list Next hands the adapter), so a
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
import type { PrerenderedPage } from "./prerendered-pages.ts"

/** The attribute that marks a page's indexable content (ADR-0015). */
export const BODY_MARKER = "data-pagefind-body"

/** Where the bundle is written, relative to the app; served at `/pagefind/`. */
export const OUTPUT_DIR = path.join("public", "pagefind")

/**
 * Left out of every page's words: what assistive technology skips as
 * decoration (section numbers, avatar initials, separators, the copy
 * button's text) is not searchable text either. Without this, a number
 * fused with the next word ("০১ধারণা") would be indexed as one word.
 */
export const EXCLUDE_SELECTORS = ['[aria-hidden="true"]']

/** Whether a page marks content for the index. */
export function hasIndexableBody(html: string): boolean {
  return html.includes(BODY_MARKER)
}

/** What a finished index holds. */
export type IndexSummary = {
  readonly pages: number
  readonly routes: number
  readonly words: number
}

/**
 * Indexes the pages of the build in `distDir` and writes the bundle to
 * `public/pagefind` under `projectDir` (cleared first). Throws, naming the
 * route, if a page's HTML cannot be read, and throws if no page was indexed
 * (a lost marker).
 */
export async function buildSearchIndex({
  distDir,
  projectDir,
  pages,
}: {
  readonly distDir: string
  readonly projectDir: string
  readonly pages: readonly PrerenderedPage[]
}): Promise<IndexSummary> {
  const outputDir = path.join(projectDir, OUTPUT_DIR)
  await rm(outputDir, { recursive: true, force: true })
  const { index, errors } = await pagefind.createIndex({
    excludeSelectors: EXCLUDE_SELECTORS,
  })
  if (index === undefined) throw new Error(errors.join("\n"))

  try {
    let indexed = 0
    let words = 0
    for (const page of pages) {
      let html: string
      try {
        html = await readFile(path.join(distDir, page.file), "utf8")
      } catch (error) {
        throw new Error(`${page.route}: cannot read ${page.file}`, {
          cause: error,
        })
      }
      if (!hasIndexableBody(html)) continue
      const added = await index.addHTMLFile({
        url: page.route,
        // The dialog normalises the query the same way.
        content: normalizeSearchText(html),
      })
      if (added.errors.length > 0) {
        throw new Error(`${page.route}: ${added.errors.join("\n")}`)
      }
      indexed += 1
      words += added.file.uniqueWords
    }
    if (indexed === 0) {
      throw new Error(
        `no page has ${BODY_MARKER}; checked ${String(pages.length)} routes`
      )
    }

    const written = await index.writeFiles({ outputPath: outputDir })
    if (written.errors.length > 0) throw new Error(written.errors.join("\n"))
    return { pages: indexed, routes: pages.length, words }
  } finally {
    await pagefind.close()
  }
}
