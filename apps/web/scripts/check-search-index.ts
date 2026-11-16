/**
 * Runs after `next build` (this app's `build` script) and fails the build
 * unless the build adapter ran and wrote the search index (ADR-0016).
 *
 * The adapter's own checks only run when Next runs it. If a later Next let a
 * platform's `NEXT_ADAPTER_PATH` win over `adapterPath`, the adapter would be
 * skipped and the site deployed without search; this check catches that.
 * `next build` cleans `.next`, so the page list there proves the adapter ran
 * in this build, and an index left in `public/` by an earlier build does not
 * pass on its own.
 */
import { existsSync } from "node:fs"
import path from "node:path"

import { OUTPUT_DIR } from "./build-search-index.ts"
import { PAGES_FILE } from "./prerendered-pages.ts"

const DIST_DIR = ".next"

/** What is missing after a build, or an empty list when the index is there. */
export function missingBuildOutputs(
  appDir: string,
  exists: (file: string) => boolean = existsSync
): string[] {
  return [
    path.join(DIST_DIR, PAGES_FILE),
    path.join(OUTPUT_DIR, "pagefind.js"),
  ].filter((file) => !exists(path.join(appDir, file)))
}

if (import.meta.main) {
  const missing = missingBuildOutputs(process.cwd())
  if (missing.length > 0) {
    process.stderr.write(
      `search index: the build adapter did not run (missing ${missing.join(", ")}); check that next.config's adapterPath still wins over NEXT_ADAPTER_PATH (ADR-0016)\n`
    )
    process.exit(1)
  }
}
