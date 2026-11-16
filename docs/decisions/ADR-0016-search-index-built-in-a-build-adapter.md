# ADR-0016: Search index built in a build adapter

- Status: accepted
- Date: 2026-11-16
- Supersedes: the "Which HTML, when, and where it is served from" and "Not verified" parts of [ADR-0015](ADR-0015-site-search-with-pagefind.md). The rest of ADR-0015 stands.

## Context

ADR-0015 built the Pagefind index after `next build`, from `.next/server/app/<route>.html`. It left one thing unverified: whether Vercel deploys files written to `public/` after `next build` has finished.

The first Vercel build (Node 24, `turbo run build` from the repo root, Root Directory `apps/web`) failed in the indexer with `ENOENT … .next/server/app/index.html`. There were two causes, both found by reading Next 16.4.5 and Vercel's adapter, and the first one reproduced locally:

1. **Vercel builds Next.js through a deployment adapter, and with an adapter Next saves the pre-rendered HTML under a different path.** A platform turns its adapter on with the `NEXT_ADAPTER_PATH` variable. Next's docs say Vercel's adapter uses the same public API as any other. With an adapter (`config.adapterPath`), `next build` writes each page to `.next/server/route-cache/APP_PAGE/<sha256 of the source route>/$/<page>.html` (`export/worker.js`, `server/lib/route-cache-key.js`). Reproduced: with a do-nothing adapter in `NEXT_ADAPTER_PATH`, the local build failed with the same `ENOENT`, and the HTML was in `route-cache`.
2. **Files written to `public/` after `next build` are not deployed.** Vercel's adapter (`nextjs/adapter-vercel`, `@next-community/adapter-vercel` 0.0.1-beta.37, read at commit `187884e`) copies `public/` into its output (`.next/output/static`, `handlePublicFiles`) inside `onBuildComplete`, which runs inside `next build`. The index was written later, so even with the right HTML path the deploy would have had no search and still succeeded.

## Decision

### The index is built in an adapter that runs before the platform's

- `next.config.ts` sets `adapterPath` to `apps/web/scripts/search-index-adapter.ts`. Next loads it with a native `import()`, so Node runs the TypeScript file directly, like the other scripts.
- **Precedence**, read in Next 16.4.5: the default config takes `adapterPath` from `NEXT_ADAPTER_PATH` (`server/config-shared.js`), and the user's config is spread over the defaults (`server/config.js`, `assignDefaultsAndValidate`). So the config's `adapterPath` wins, and this adapter runs on every build. The variable is still in `process.env`, so it can load the platform's adapter.
- That adapter, the _inner_ adapter, is loaded from `NEXT_ADAPTER_PATH` the way Next loads an adapter: resolved from Next's package, and the module's default export or the module itself. Locally the variable is unset and there is no inner adapter.
- **Every hook of the inner adapter is kept** (`withSearchIndex` in `scripts/with-search-index.ts`): the adapter Next gets is the inner adapter spread, with only `onBuildComplete` replaced. A hook Vercel adds later is passed on unchanged. The name is the inner adapter's, or `search-index` when there is none.
- `onBuildComplete` builds the index first, then calls the inner adapter's `onBuildComplete`. On Vercel, that adapter then copies `public/` with the index in it.
- `VERCEL` and `NEXT_ADAPTER_PATH` are in the `build` task's `env` in `turbo.json`. Turbo's strict mode passes only listed variables to the task, so without this neither would reach `next build`. They also change what the build writes, so they belong in the cache key.

### Which HTML, and where it is

- The HTML comes from Next's adapter API: `outputs.prerenders`, the entries with `routeType: "page"` and `htmlSize > 0`, each with its file in `fallback.filePath`. Nothing builds the path itself, so the hashed `route-cache` layout does not matter.
- The adapter writes that list (route and file, relative to `.next`) to `.next/prerendered-pages.json` (`scripts/prerendered-pages.ts`). The end-to-end tests (`e2e/support/routes.ts`) and the Lighthouse script read the routes and HTML from it. It holds only this build's pages, so nothing from an earlier build is read.
- `/_not-found` is not in the list: Next hands it to adapters as the static 404 file, not as a prerender (`build/adapter/build-complete.js`). It is an error page with no indexable content, and the tests already skipped it. So "N of M pages" counts one route fewer than under ADR-0015: 1 of 7 without drafts (was 1 of 8), 230 of 235 with drafts (was 230 of 236). The same pages are indexed.
- Every build now has the adapter layout, locally too, so local builds, `next start` and the end-to-end tests run on the same file layout as Vercel.
- Unchanged from ADR-0015: each page is indexed through Pagefind's Node API with an explicit URL. The bundle goes to `apps/web/public/pagefind/` (cleared first, ignored by git) and is served from `/pagefind/`. `turbo.json` lists `public/pagefind/**` among the `build` outputs. Pagefind is `pagefind@1.5.2`.

### The build fails instead of deploying without search

- A page route with HTML but no file from Next, or whose file cannot be read, fails the build, naming the route.
- No page indexed fails the build (a lost marker), as before. A page without `data-pagefind-body` is skipped on purpose.
- On Vercel (`VERCEL` set), the build fails before indexing if `NEXT_ADAPTER_PATH` names no adapter.
- On Vercel, after the inner adapter's `onBuildComplete`, the build fails unless `.next/output/static/pagefind/pagefind.js` exists. That folder is Vercel's adapter's internal layout, not an API, so it is only checked, never written. If it moves, the build fails and says so.
- After `next build`, the app's `build` script runs `scripts/check-search-index.ts` (`next build && node scripts/check-search-index.ts`). It fails the build unless `.next/prerendered-pages.json` and `public/pagefind/pagefind.js` both exist. It covers the one case the adapter cannot check itself: the adapter not being run at all. `next build` cleans `.next`, so the page list proves the adapter ran in this build, and an index left in `public/` by an earlier build does not pass on its own. It checks for the index, not for Vercel's copy of it: if the adapter did not run, the index was never written.
- Checked locally with stand-in inner adapters: one that copies `public/` as `handlePublicFiles` does (index built first, the inner `modifyConfig` and `onBuildComplete` both run, build passes), one that does not (build fails: "did not deploy public/pagefind"), and `VERCEL=1` with no adapter (build fails, naming `NEXT_ADAPTER_PATH`). Vercel's real adapter could not be run locally: it needs `@vercel/build-utils`, which Vercel's build environment supplies.

### The adapter API in this Next version

- `adapterPath` became a stable top-level option in Next 16.2.0 (the 16 upgrade guide; before that it was `experimental.adapterPath`). Next 16.4.5 documents the adapter API under API reference, not as experimental. Vercel's own adapter package is still a beta (`0.0.1-beta.37`).
- What breaks if it changes:
  - If `NEXT_ADAPTER_PATH` came to win over the config, this adapter would not run on Vercel, and its own checks would not run either. The post-build check then fails the build: there is no page list and no index.
  - If the prerender outputs stopped giving `fallback.filePath`, `routeType` or `htmlSize`, the build fails (no file named for a route, or no page indexed).
  - If `onBuildComplete` moved out of `next build`, or Vercel's adapter copied `public/` elsewhere, the deploy check fails the build.
  - Next is pinned to an exact version, so any of these can only arrive with an upgrade. On an upgrade, re-read the precedence in `server/config-shared.js` and `server/config.js`, and check the preview build log for the `search index:` line.

### Verified on a preview deploy

To be confirmed on the first preview deploy of this change: the build log shows `Running onBuildComplete from Vercel` and `search index: N of M pages`, `/pagefind/pagefind.js` is served, and search finds pages on the preview URL.

## Alternatives considered

- **Keep the post-build script and compute the `route-cache` paths:** it depends on Next's hash scheme and on Vercel's output folder, which neither project treats as an API. The deployed output would also need writing into Vercel's folder.
- **Records built from the MDX source before `next build` (`addCustomRecord`), ADR-0015's fallback:** it gets around both problems, but search would see source, not what the reader sees, and it would duplicate rendering logic.
- **Our adapter only when `NEXT_ADAPTER_PATH` is set, the post-build script otherwise:** two code paths, and local builds and tests would not run on Vercel's layout.
- **Forwarding only `modifyConfig` and `onBuildComplete`:** a hook Vercel's adapter adds later would be dropped without anyone noticing.

## Consequences

- The search index is written inside `next build`; after it, `pnpm build` only checks that the index is there.
- Every build uses the adapter layout. Code that needs a page's HTML reads `.next/prerendered-pages.json`, never a path under `.next/server`.
- A Vercel deploy without the index fails at build time, including when the adapter is not run.
- The precedence of `adapterPath` over `NEXT_ADAPTER_PATH` is still worth re-reading on every Next upgrade. A change would fail the build rather than ship without search, but the fix then needs another way to run before Vercel's adapter.
- Vercel's adapter runs inside ours. A Vercel build-log or support question about the adapter should mention that the project wraps it.
