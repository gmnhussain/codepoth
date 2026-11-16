/**
 * Wraps a deployment adapter so the search index is built inside
 * `next build`, before the adapter runs (ADR-0016).
 *
 * A deployment adapter collects `public/` in its `onBuildComplete`, which
 * runs inside `next build`. An index written after `next build` would never
 * be deployed. So this adapter builds the index first, then hands the build
 * to the inner adapter. Every hook of the inner adapter is kept as it is;
 * only `onBuildComplete` is wrapped.
 */
import type { NextAdapter } from "next"

/** What Next passes to `onBuildComplete`. */
export type BuildCompleteContext = Parameters<
  NonNullable<NextAdapter["onBuildComplete"]>
>[0]

export type SearchIndexHooks = {
  /** Whether this build runs on Vercel (the `VERCEL` variable is set). */
  readonly onVercel: boolean
  /** Builds the index; throws when a page is missing or none is indexed. */
  readonly buildIndex: (ctx: BuildCompleteContext) => Promise<void>
  /** Whether the inner adapter's deploy output holds the index. */
  readonly deployHasIndex: (ctx: BuildCompleteContext) => Promise<boolean>
}

/** Used as the name when no deployment adapter is set (local builds). */
const OWN_NAME = "search-index"

/**
 * The adapter Next runs: the inner adapter's hooks, with the index built
 * before its `onBuildComplete`. On Vercel the build fails if there is no
 * inner adapter, or if the index is missing from its output afterwards.
 */
export function withSearchIndex(
  inner: NextAdapter | undefined,
  hooks: SearchIndexHooks
): NextAdapter {
  return {
    ...inner,
    name: inner?.name ?? OWN_NAME,
    async onBuildComplete(ctx) {
      if (hooks.onVercel && inner === undefined) {
        throw new Error(
          "search index: this build runs on Vercel, but NEXT_ADAPTER_PATH names no adapter; without it, nothing is deployed the way Vercel expects"
        )
      }
      await hooks.buildIndex(ctx)
      await inner?.onBuildComplete?.(ctx)
      if (hooks.onVercel && !(await hooks.deployHasIndex(ctx))) {
        throw new Error(
          `search index: ${inner?.name ?? OWN_NAME} did not deploy public/pagefind`
        )
      }
    },
  }
}
