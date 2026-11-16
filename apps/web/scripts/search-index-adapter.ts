/**
 * The build adapter `next.config.ts` names in `adapterPath` (ADR-0016). Next
 * loads it with a native `import()`, so Node runs this TypeScript file
 * directly, as it runs the other scripts here.
 *
 * `adapterPath` in the config wins over `NEXT_ADAPTER_PATH`, the variable a
 * platform sets for its own adapter (Next spreads the config over defaults
 * read from the variable). So this adapter runs on every build, and loads
 * the platform's adapter from the variable as its inner adapter: on Vercel,
 * Vercel's adapter, which still runs every hook it has. Locally there is no
 * inner adapter, and the build is the same apart from Vercel's output.
 */
import { access, mkdir, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import type { NextAdapter } from "next"

import { buildSearchIndex, OUTPUT_DIR } from "./build-search-index.ts"
import {
  PAGES_FILE,
  pagesFromPrerenders,
  serializePages,
} from "./prerendered-pages.ts"
import { withSearchIndex } from "./with-search-index.ts"
import type { BuildCompleteContext } from "./with-search-index.ts"

/**
 * The platform's adapter, loaded the way Next loads an adapter: resolved
 * from Next's own package, and the module's default export (or the module).
 */
async function loadInnerAdapter(): Promise<NextAdapter | undefined> {
  const innerPath = process.env.NEXT_ADAPTER_PATH
  if (innerPath === undefined || innerPath === "") return undefined
  const resolved = createRequire(
    import.meta.resolve("next/package.json")
  ).resolve(innerPath)
  // A variable naming this file would make it its own inner adapter.
  if (path.resolve(resolved) === fileURLToPath(import.meta.url)) {
    return undefined
  }
  const mod = (await import(pathToFileURL(resolved).href)) as {
    default?: NextAdapter
  } & NextAdapter
  return mod.default ?? mod
}

async function buildIndex(ctx: BuildCompleteContext): Promise<void> {
  const pages = pagesFromPrerenders(ctx.outputs.prerenders, ctx.distDir)
  await mkdir(ctx.distDir, { recursive: true })
  await writeFile(path.join(ctx.distDir, PAGES_FILE), serializePages(pages))
  const summary = await buildSearchIndex({
    distDir: ctx.distDir,
    projectDir: ctx.projectDir,
    pages,
  })
  process.stdout.write(
    `search index: ${String(summary.pages)} of ${String(summary.routes)} pages, ${String(summary.words)} unique words → ${OUTPUT_DIR}\n`
  )
}

/**
 * Whether Vercel's output holds the index. `.next/output/static` is where
 * Vercel's adapter copies `public/` (nextjs/adapter-vercel,
 * `handlePublicFiles`); it is that adapter's internal layout, not an API.
 * It is only checked here, never written: if it moves, the build fails and
 * says so, instead of deploying a site without search.
 */
async function deployHasIndex(ctx: BuildCompleteContext): Promise<boolean> {
  const entry = path.join(
    ctx.distDir,
    "output",
    "static",
    "pagefind",
    "pagefind.js"
  )
  try {
    await access(entry)
    return true
  } catch {
    return false
  }
}

const adapter: NextAdapter = withSearchIndex(await loadInnerAdapter(), {
  onVercel: Boolean(process.env.VERCEL),
  buildIndex,
  deployHasIndex,
})

export default adapter
