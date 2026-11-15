import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import type { Labels } from "@workspace/config/labels"
import { site } from "@workspace/config/site"
import { createTranslator } from "@workspace/config/translate"

/**
 * The label set the site uses, read as a file: Playwright loads tests as ES
 * modules, and Node does not import JSON without an import attribute, so
 * `@workspace/config/t` (which imports the set) cannot load here. The set
 * file sits in `labels/` next to `site.ts`; `labels.test.ts` and
 * `active.test.ts` in `packages/config` check its keys and that it is the
 * set `site.labelSet` names.
 */
function readActiveLabels(): Labels {
  const siteModule = import.meta.resolve("@workspace/config/site")
  const file = new URL(`labels/${site.labelSet}.json`, siteModule)
  return JSON.parse(readFileSync(fileURLToPath(file), "utf8")) as Labels
}

/**
 * `t()` with the site's labels, for expected UI text: tests never copy a
 * string from the label files (conventions §14).
 */
export const t = createTranslator(readActiveLabels())
