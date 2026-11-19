# Performance

**Ship HTML and CSS, and as little JavaScript as possible: everything that can be computed at build time is computed at build time.**

Every route is pre-rendered ([ADR-0004](../decisions/ADR-0004-vercel-ssg-not-static-export.md)). The rules below keep those pages fast once they reach the reader. Performance work is measured before and after ([conventions](conventions.md#1-principles)).

## Rendering

- Server Components by default. Client components are small islands only where the browser is needed: quiz, mark-done and bookmark buttons, theme toggle, search trigger, progress overlays.
- Islands get their labels as data, only the groups in scope (`LabelScope` + `useT()`), never the whole label set in the JavaScript ([ADR-0013](../decisions/ADR-0013-labels-in-client-islands.md)); measured on 2026-11-15, this took about 4.4 KB gzip off every route's First Load JS.
- Reader progress is read from localStorage after hydration through a `useSyncExternalStore` hook, so the server HTML is the same for every reader and there is no hydration mismatch. Storage rules: [conventions](conventions.md#10-frontend).
- Reading time, the table of contents and prev/next links are computed at build time, never in the browser.

## Fonts

- Load every font file with `next/font`, with `subsets: ["bengali", "latin"]` for the Bangla font, `display: "optional"`, and a preload: every page uses both fonts. The one exception is the Bangla digits face: about 1.8 KB per weight, declared in the stylesheet with `font-display: swap` and not preloaded. Its digits have Hind Siliguri's widths and line metrics, so when Hind Siliguri made the first paint the swap changes only their shapes, never a line break. When a Hind face missed it (Hind 600 always does on Slow 4G locally), the digits start in the system fallback, can change width when the face arrives and can shift text slightly (up to about 0.008 measured) ([ADR-0017](../decisions/ADR-0017-one-font-for-text-and-headings.md), [measurements](#bangla-digits-2026-11-19)).
- Why `optional`, not `swap`: a web font that arrives after the first paint makes text re-wrap, because the fallback fonts (Nirmala UI, Noto Sans Bengali, Arial…) are not the same width. With `swap`, the end-to-end sweep (Phase 5) measured layout shifts of up to 0.26 on slow loads at 320 px, from chips, breadcrumbs, stats and filter rows changing their line count, and 0.13 on `/contents` when JetBrains Mono (not preloaded then) arrived about 2 s in.
- With `optional`, a face that is not ready by the first paint is not swapped in later: it stays in the fallback for the whole document, including client-side navigations, which keep the document. It still downloads, so the next full page load (a reload, or a new visit while it is cached) uses it. Measured on a throttled first load (150 ms latency, 1.6 Mbps): the page stays in the fallback fonts with a layout shift of 0.
- Fonts do not always make the first paint. Lighthouse on localhost showed every font finishing before it ([Font bytes](#font-bytes)), but a deployed site on a mobile connection does not. Measured on the live site on 2026-11-18 with `pnpm measure:fonts` ([method](#targets-and-measurement); `/`, `/roadmap`, `/contents`, 3 runs each), before [ADR-0017](../decisions/ADR-0017-one-font-for-text-and-headings.md):
  - No throttling: first paint about 0.4–0.5 s, the preloaded fonts arrive before it and render.
  - Fast 4G: first paint about 0.93 s. Hind Siliguri's files arrive at 0.59–0.89 s and render; Anek Bangla's 152 KB Bangla file arrives at about 1.1 s, and headings stayed in the system font in 8–9 of 9 loads.
  - Slow 4G: first paint about 2.0–2.5 s; headings in the system font in 9 of 9 loads, body text renders.
  - JetBrains Mono, not preloaded then, rendered in the fallback in every load on every profile. It is preloaded since, and its fallback is a monospace stack ([design.md](../design.md#fonts)).
- So the fonts are few and small enough to arrive with the first paint on Fast 4G: one family for text and headings ([ADR-0017](../decisions/ADR-0017-one-font-for-text-and-headings.md)), Hind Siliguri at 400, 500 and 600 only (no 700), and JetBrains Mono's Latin subset. A new font, weight or subset is measured with `pnpm measure:fonts` on a deployed preview before it is added.
- Font families and weights: [design.md](../design.md#fonts).

## Build-time rendering instead of client libraries

- Code highlighting with Shiki at build time. Shiki is never shipped to the browser.
- No `mermaid.js` in the browser.
- The roadmap map is an inline SVG generated at build time from `content/map.json`. No client-side graph or map library; only the reader's progress highlights are added on the client.
- Diagrams are SVG.

## Loaded only when needed

- Search: the page carries only the header button and the shortcut listener. The dialog's code is its own chunk, fetched once the page has loaded and is idle (`requestIdleCallback` after `load`, at most 2 s), or earlier when the button is hovered or focused or search opens, so a reader who types right after ⌘K keeps every character; Pagefind (`/pagefind/pagefind.js`, its worker, WASM and index) is fetched only once the dialog opens, through `import(/* webpackIgnore: true */ …)`, never bundled ([ADR-0015](../decisions/ADR-0015-site-search-with-pagefind.md)). Sizes: [Site search](#site-search-2026-11-15).
- Giscus comments load when the comments area scrolls into view (IntersectionObserver).
- `<DeepDive>` is a native `<details>` element and needs no JavaScript.

## Assets and imports

- Raster images through `next/image` with explicit `sizes`.
- No barrel imports; import from the module that defines the thing ([conventions](conventions.md#5-repository-and-boundaries)).
- Theme switching with next-themes and `suppressHydrationWarning` on `<html>`, so there is no flash of the wrong theme.

## Targets and measurement

Core Web Vitals at the 75th percentile, on mobile:

| Metric | Target   |
| ------ | -------- |
| LCP    | < 2.5 s  |
| INP    | < 200 ms |
| CLS    | < 0.1    |

- Lighthouse is measured locally with `pnpm lighthouse <path>… [--progress]` (`apps/web/scripts/lighthouse.ts`), on a build with drafts (`CONTENT_INCLUDE_DRAFTS=1 pnpm build --force`). It uses the baseline method below: Lighthouse 13.6.0 through `pnpm dlx` (not a dependency), the default mobile profile, the installed Google Chrome, `next start`, and the median of 3 runs per page, printed as the tables in this file. With `--progress` it first reads lessons in that Chrome as a reader does (three marked done, two opened, a bookmark, a quiz answered, a last-read lesson at a saved section) and keeps that storage. It is not a CI gate ([conventions §15](conventions.md#15-ci-gates-every-pull-request)).
- Font loading on a reader's first visit is measured on a deployed site with `pnpm measure:fonts <url> [path…] [--runs N]` (`apps/web/scripts/measure-fonts.ts`), because Lighthouse on localhost does not show it: there, every font arrives before the first paint. Method: Playwright's Chromium (already in the repo), a fresh browser context per load with the cache disabled, no throttling and Chrome DevTools' Fast 4G (165 ms, 9 Mbps) and Slow 4G (562.5 ms, 1.6 Mbps) presets applied through the DevTools protocol, 3 runs per page and profile (default pages `/`, `/roadmap`, `/contents`), after one uncounted warm-up load. Per load it records the first paint and how many font files the page requested and when the last one finished (read before the probe draws anything, so files only the probe would fetch are left out). For each `@font-face` face it reports "unused" when the page never requested its file; for a `display: optional` face, whether it renders in the web font or the fallback (a face that missed the first paint stays in the fallback for the whole page view); for a `swap` face, "real" when its file finished before the first paint and "late" when it swapped in after. It prints a table of median times and, per family, in how many loads it was real, late, partial, fallback or unused. In Git Bash, `/` arguments are rewritten to Windows paths: run it in PowerShell.
- The pages measured at each milestone: Home (`/`), a lesson (`/learn/frontend/react/use-effect`) and the Map (`/roadmap`) fresh; those three, the React topic (`/learn/frontend/react`) and the Dashboard (`/dashboard`) with `--progress`.
- `@next/bundle-analyzer` to inspect client bundles when a page's JavaScript grows (planned).
- Turborepo remote cache on Vercel to keep builds fast.

### Known layout shift

- **Page:** `/contents#track-…` (a link to a closed track, e.g. `/contents#track-frontend`), measured 2026-11-15 in headless Chrome on a local production build.
- **CLS:** cold load (browser cache cleared) with JavaScript on: 0.36 at 1280px, 0.62 at 768px. Warm load: 0. JavaScript off: 0. Loads without a hash: 0.
- **Cause:** the track's `#track-…` target sits inside its closed `<details>`, and Chrome opens it itself ("ancestor details revealing") once parsing ends. On a cold load with JavaScript on, Chrome first paints a frame already scrolled to the still-closed track, with the closed tracks below it in view; opening the track then pushes them down. Without JavaScript, parsing ends before the first paint, so that frame does not exist. Opening the track from the island instead (the earlier behaviour) measured the same.
- **Status:** left for a performance trace in Phase 5, to find what triggers the early paint.
- **Phase 5 measurement (2026-11-16):** after the switch to `font-display: optional` ([Fonts](#fonts)), the shift is rare. Cold loads of `/contents#track-soft-skills` (the last track; each load in a fresh browser context, `next start`, JavaScript on) shifted in 3 of 56 loads, 0.24 at 1280px and 0.39 at 768px when it happened, and 0 in the other 53. The only shifting element was the footer, in view below the closed track in the early frame and pushed out of view when the track opened.
- **What the trace showed:** a Chrome performance trace adds enough overhead that the shift never happens while tracing (0 of 8 traced loads), so the order was logged in the page instead: a `MutationObserver` for the `open` attribute, `readystatechange`, scroll events and the first animation frames. In the shifting load, Chrome drew a frame at 170 ms while the HTML (245 KB) was still being parsed (`interactive` at 174 ms), opened the target's `<details>` at 182 ms (just after parsing ended), painted first content at 184 ms and scrolled to the fragment at 193 ms; the shift was recorded at 195 ms. In every load without a shift, parsing ended 60–120 ms before the first frame, so the opening and the scroll both happened before anything was drawn.
- **Why it is not fixed:** the shift needs Chrome to schedule a frame while parsing a long page, which the page does not control. Avoiding it would mean opening the targeted track before the first paint, and the hash is only known in the browser: that takes a blocking script before the list, which was rejected. A `:target` / `::details-content` CSS rule was tried in Phase 3 without effect, and the trace gave no reason it would behave differently now. Kept as a known, rare shift.

Contents filtered by the URL (found by the end-to-end tests, 2026-11-16):

- **Page:** `/contents?q=…`, and `/contents?status=todo|done` when the reader has saved progress. The search dialog's "সূচিপত্রে খোঁজো" link on no results goes to `/contents?q=…` as a full page load, so this happens inside the site too, not only on shared links.
- **CLS:** 0.21 on every load of `/contents?q=useEffect` at 1280px (warm and cold), with no input. `/glossary?letter=…` and `/roadmap?topic=…` measure 0.
- **Cause:** the page is static, so its HTML is the whole list for every URL. The island reads `?q=` and `?status=` only after hydration ([design.md](../design.md#contents-page)), hides the tracks without a match, and the first matching track moves up into view. Avoiding it would need a blocking script before the list, which was rejected.
- **Status:** accepted. The end-to-end test checks that a shared link applies and records its load shift without failing on it; every in-page search and filter is held to the 0.01 limit.

Early status filter click (found by the end-to-end tests, 2026-11-16):

- **Page:** `/contents` with saved progress.
- **CLS:** 0.07 when "পড়া শেষ" is clicked before the reader's progress has loaded (the first ~100–300 ms after hydration, while the schema chunk loads, [ADR-0014](../decisions/ADR-0014-reader-progress-implementation.md)). The filter shows no lessons until the progress arrives; the matching lessons then appear more than 500 ms after the click, so the shift does not count as caused by input.
- **Status:** accepted, rare. A click after the count shows (as the end-to-end test does) does not shift.

## Baseline (2026-11-15, end of Phase 2)

Lighthouse 13.6.0, default mobile profile (simulated slow 4G and 4× CPU throttling), against a local production build with drafts (`next start`, commit `ed3ed97`); median of 3 runs per page.

| Page                  | Performance | LCP    | CLS | TBT    | Accessibility | Best practices | SEO  |
| --------------------- | ----------- | ------ | --- | ------ | ------------- | -------------- | ---- |
| Home                  | 99          | 0.92 s | 0   | 112 ms | 100           | 100            | 66\* |
| Lesson (`use-effect`) | 100         | 0.92 s | 0   | 49 ms  | 100           | 100            | 66\* |
| Map (`/roadmap`)      | 100         | 0.91 s | 0   | 40 ms  | 100           | 100            | 66\* |

\* The only failing audit is `is-crawlable`: this build sends `noindex, nofollow` on purpose (a build with drafts is never indexable, [conventions §12](conventions.md#12-public-site-and-seo)). On an indexable build (`VERCEL_ENV=production`, no drafts) Home and the Map score 100 on SEO with no failing audit; lessons could not be measured there while every lesson is a draft.

Limits of these numbers:

- Lab scores on localhost: network latency is only Lighthouse's simulated throttle, not a real connection or CDN.
- INP cannot be measured in a lab run; TBT stands in for it.
- Field data (the 75th-percentile targets above) comes only from real visitors after launch.

Other findings from the same runs:

- First Load JS per route after the label-bundle change ([ADR-0013](../decisions/ADR-0013-labels-in-client-islands.md)): about 176 KB gzip for most pages, 184 KB for the Map and 197 KB for a lesson.
- The one stylesheet (13 KB) is render-blocking; Lighthouse estimates 30–50 ms to gain. Not acted on.

### Font bytes

The same 9 files load on all three pages, 379.4 KB in all (transfer size, from Lighthouse's network requests):

| File (family · weight · subset)   | Size         | Preloaded              |
| --------------------------------- | ------------ | ---------------------- |
| Anek Bangla · variable · Bangla   | 152.8 KB     | yes                    |
| Anek Bangla · variable · Latin    | 42.4 KB      | yes                    |
| Hind Siliguri · 400 · Bangla      | 39.8 KB      | yes                    |
| Hind Siliguri · 500 · Bangla      | 39.8 KB      | yes                    |
| Hind Siliguri · 600 · Bangla      | 39.3 KB      | yes                    |
| Hind Siliguri · 400 · Latin       | 8.3 KB       | yes                    |
| Hind Siliguri · 500 · Latin       | 8.5 KB       | yes                    |
| Hind Siliguri · 600 · Latin       | 8.4 KB       | yes                    |
| JetBrains Mono · variable · Latin | 40.1 KB      | no                     |
| **Total**                         | **379.4 KB** | 8 preloaded (339.3 KB) |

- They do not delay LCP: every `@font-face` uses `font-display: swap` with a metric-matched fallback (`next/font`), Lighthouse's font-display check passes, and in these runs every font had finished (94–147 ms) before the first paint (205–228 ms observed), where LCP equals FCP. The LCP element is text: Home's heading, the lesson's description, the Map's summary. That holds on localhost only: on the live site with a Fast 4G connection, Anek Bangla arrived after the first paint ([Fonts](#fonts)).
- JetBrains Mono loads on all three pages, because each shows some monospace text (track numbers, lesson numbers, code). It was not preloaded in these runs; it has been since 2026-11-18, because a code font fetched after the CSS missed `display: optional`'s window and code stayed in the fallback for the whole visit. As built, the 9 preloaded files are 374.5 KB (file sizes; the table above shows Lighthouse's transfer sizes).
- The largest single file was Anek Bangla's Bangla subset (152.8 KB, the variable font). Anek Bangla was removed on 2026-11-18 ([ADR-0017](../decisions/ADR-0017-one-font-for-text-and-headings.md)): as built, the preloaded fonts went from 9 files, 374.5 KB, to 7 files, 180.4 KB (Hind Siliguri's six files, 140.8 KB, and JetBrains Mono's Latin file, 39.5 KB).

## With reader progress (2026-11-15, end of Phase 3)

Same setup as the Phase 2 baseline (Lighthouse 13.6.0, default mobile profile, local production build with drafts, median of 3 runs), at commit `4bcd381`, with saved progress in the browser: three lessons done, two in progress, a bookmark, a quiz attempt and a last-read lesson at a saved section. Lighthouse ran against a Chrome that already held this progress, with `--disable-storage-reset`; Home's request for `/lessons.json` in the runs shows the progress was read.

| Page                  | Performance | LCP    | CLS | TBT    | Accessibility | Best practices | SEO  |
| --------------------- | ----------- | ------ | --- | ------ | ------------- | -------------- | ---- |
| Home                  | 100         | 0.72 s | 0   | 52 ms  | 100           | 100            | 66\* |
| Lesson (`use-effect`) | 100         | 0.77 s | 0   | 59 ms  | 100           | 100            | 66\* |
| Map (`/roadmap`)      | 100         | 0.81 s | 0   | 75 ms  | 100           | 100            | 66\* |
| Topic (React)         | 100         | 0.70 s | 0   | 46 ms  | 100           | 100            | 66\* |
| Dashboard             | 98          | 0.65 s | 0   | 176 ms | 100           | 100            | 66\* |

\* As in the Phase 2 baseline: the only failing SEO audit is `is-crawlable`, because a build with drafts is `noindex` on purpose.

- Every page that shows progress stays at CLS 0 with saved progress: marks and counts change in place, and blocks that depend on the reader have reserved slots ([ADR-0014](../decisions/ADR-0014-reader-progress-implementation.md)). Checks in the browser also measured CLS 0 at 375, 768 and 1280 px in both themes on every page.
- The Dashboard has the most to render on the client (every section is drawn from the progress), so its TBT is the highest (112–213 ms across the three runs); it is a reader's page, visited after reading.
- A first run found one accessibility failure, fixed in `4bcd381`: the Dashboard's "মোট অগ্রগতি" heading had been rendered through Base UI's `ProgressLabel`, which sets `role="presentation"`.
- First Load JS per route (gzip, without `noModule` scripts): Home 179.9 KB, lesson 203.0 KB, topic 182.8 KB, Map 189.7 KB, Contents 184.2 KB, Glossary 181.5 KB, Dashboard 189.2 KB, About 177.3 KB. Against the Phase 2 numbers above, a page gains about 2–8 KB for its progress islands and the store; Zod is not in any of them (it loads in its own chunk after hydration). Home's resume data and the import/export code load only when used.
- The known layout shift on `/contents#track-…` cold loads (above) is unchanged by reader progress.

## Site search (2026-11-15)

Pagefind search ([ADR-0015](../decisions/ADR-0015-site-search-with-pagefind.md)), measured on local production builds with drafts (`CONTENT_INCLUDE_DRAFTS=1`, `next start`).

### First Load JS

**Method (this table only):** for each route, the gzip size (Node `zlib`, default level) of every distinct `<script src>` in the route's pre-rendered HTML (then `.next/server/app/<route>.html`; since [ADR-0016](../decisions/ADR-0016-search-index-built-in-a-build-adapter.md) the file is listed in `.next/prerendered-pages.json`), `noModule` scripts left out, summed. Both columns were measured this way on the same day. This count is larger than the one behind the Phase 2 and Phase 3 figures above (Home 179.9 KB there, 219.0 KB here for the same `main`), so compare numbers only within one table.

| Route                 | `main` (`229b5b1`) | With search (`d18475f`) | Change  |
| --------------------- | ------------------ | ----------------------- | ------- |
| Home                  | 219.0 KB           | 221.0 KB                | +2.0 KB |
| Lesson (`use-effect`) | 242.1 KB           | 244.1 KB                | +2.0 KB |
| Topic (React)         | 221.9 KB           | 223.9 KB                | +2.0 KB |
| Map (`/roadmap`)      | 228.8 KB           | 230.7 KB                | +1.9 KB |
| Contents              | 223.3 KB           | 225.2 KB                | +1.9 KB |
| Glossary              | 220.6 KB           | 222.5 KB                | +1.9 KB |
| Dashboard             | 228.3 KB           | 230.7 KB                | +2.4 KB |
| About                 | 216.3 KB           | 218.3 KB                | +2.0 KB |

The 2 KB on every page is the header's search button, the ⌘K / Ctrl+K listener and the platform check for the shortcut box. Nothing of the dialog or of Pagefind is in it.

The fix that keeps keys typed right after ⌘K (the idle prefetch of the dialog's chunk and a synchronous open, [ADR-0015](../decisions/ADR-0015-site-search-with-pagefind.md#what-loads-in-the-browser-and-when)) adds 0.1–0.2 KB to every route, measured the same way: Home 221.2 KB, lesson 244.3 KB, topic 224.1 KB, Map 230.8 KB, Contents 225.4 KB, Glossary 222.7 KB, Dashboard 230.8 KB, About 218.5 KB.

### What opening search downloads

Bytes over the wire (`encodedDataLength`, page and Pagefind's worker), cold cache, drafts index of 230 pages:

| When                          | Transfer | What                                                                                                                                    |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Page load                     | 0        | No search request.                                                                                                                      |
| Idle after load               | 4.4 KB   | the dialog's chunk only: 50–140 ms after `load` on a fast connection, about 1.0–1.3 s after `load` on Slow 3G. No `/pagefind/` request. |
| Dialog opens                  | 83.5 KB  | `pagefind.js` 13.3 KB, worker 0.6 KB, entry 0.7 KB, index metadata 1.9 KB, WASM 67.0 KB (already compressed by Pagefind).               |
| First query (`React`)         | 34.4 KB  | one index chunk 24.2 KB and a fragment per shown result (0.7–3.7 KB each).                                                              |
| Next query (`ফাংশনের return`) | 2.7 KB   | one fragment; the index chunk is already loaded.                                                                                        |

- Result links do not prefetch their pages (`prefetch={false}`): with prefetching, the first query also fetched 25.8 KB of lesson data the reader had not chosen (fixed in `d18475f`).
- On disk the bundle is about 0.9 MB, mostly fragments (one per page) and Pagefind's unused UI files; a reader only downloads what the table shows.
- CLS stays 0 while opening, typing and moving through results, at 375, 768 and 1280 px in both themes. One run recorded a single 0.0003 shift not caused by input; eight later runs of the same flow, cold and warm, recorded none, and its source was not captured.

## End of Phase 5 (2026-11-16)

Measured on the build with drafts (`CONTENT_INCLUDE_DRAFTS=1 pnpm build --force`) at commit `de5993c`, with fonts on `font-display: optional` ([Fonts](#fonts)).

### Lighthouse

`pnpm lighthouse` ([method](#targets-and-measurement)), Chrome 157, median of 3 runs.

Fresh (storage reset before each run, as in the Phase 2 baseline):

| Page                  | Performance | LCP    | CLS | TBT    | Accessibility | Best practices | SEO  |
| --------------------- | ----------- | ------ | --- | ------ | ------------- | -------------- | ---- |
| Home                  | 98          | 0.94 s | 0   | 156 ms | 100           | 100            | 66\* |
| Lesson (`use-effect`) | 98          | 0.99 s | 0   | 170 ms | 100           | 100            | 66\* |
| Map (`/roadmap`)      | 99          | 1.02 s | 0   | 135 ms | 100           | 100            | 66\* |

With saved progress (`--progress`, as in the Phase 3 table):

| Page                  | Performance | LCP    | CLS | TBT    | Accessibility | Best practices | SEO  |
| --------------------- | ----------- | ------ | --- | ------ | ------------- | -------------- | ---- |
| Home                  | 100         | 0.77 s | 0   | 55 ms  | 100           | 100            | 66\* |
| Lesson (`use-effect`) | 100         | 0.74 s | 0   | 60 ms  | 100           | 100            | 66\* |
| Map (`/roadmap`)      | 100         | 0.83 s | 0   | 69 ms  | 100           | 100            | 66\* |
| Topic (React)         | 100         | 0.71 s | 0   | 90 ms  | 100           | 100            | 66\* |
| Dashboard             | 95          | 0.76 s | 0   | 251 ms | 100           | 100            | 66\* |

\* As in the earlier tables: the only failing SEO audit is `is-crawlable`, because a build with drafts is `noindex` on purpose.

- CLS is 0 on every page, and accessibility, best practices and LCP are as before (every LCP under 1.1 s, far below the 2.5 s target).
- TBT on fresh loads is higher in the table above than in the Phase 2 baseline (Home 112, lesson 49, Map 40 ms), so it was compared directly. The Phase 2 baseline commit (`ed3ed97`, built with drafts in a temporary worktree) and this commit were served side by side and measured fresh with the same Chrome, alternating old and new, 5 runs each:

  | Page                  | TBT, Phase 2 (`ed3ed97`)         | TBT, Phase 5 (`2ac34b6`)         | LCP, old / new |
  | --------------------- | -------------------------------- | -------------------------------- | -------------- |
  | Home                  | median 78 (59, 64, 78, 93, 145)  | median 98 (43, 51, 98, 119, 154) | 0.95 / 0.95 s  |
  | Lesson (`use-effect`) | median 71 (41, 52, 71, 100, 101) | median 66 (46, 58, 66, 82, 102)  | 0.95 / 0.95 s  |

  The ranges overlap fully and neither commit is consistently higher (the Phase 5 build measured higher in 2 of the 5 pairs on each page, lower in 3), so the higher numbers in the table come from run-to-run variation on this machine, not from the code since Phase 2. The 200 ms INP target is checked with field data after launch ([Targets](#targets-and-measurement)).

- The Dashboard still has the most to draw on the client (176 ms TBT with progress in Phase 3, 156–251 ms here).

### First Load JS

**Method (this table only):** for each route, the gzip size (Node `zlib`, default level) of every distinct `<script src>` in the route's pre-rendered HTML, `noModule` scripts left out, summed. The same script measured `main` (`b011882`, before Phase 5) and this branch; its totals are lower than the [Site search](#first-load-js) table's for the same code, so compare only within this table.

| Route                 | `main` (`b011882`) | Phase 5 (`de5993c`) |
| --------------------- | ------------------ | ------------------- |
| Home                  | 182.5 KB           | 182.5 KB            |
| Lesson (`use-effect`) | 205.6 KB           | 205.6 KB            |
| Topic (React)         | 185.4 KB           | 185.4 KB            |
| Map (`/roadmap`)      | 192.1 KB           | 192.2 KB            |
| Contents              | 186.7 KB           | 186.7 KB            |
| Glossary              | 184.0 KB           | 184.0 KB            |
| Dashboard             | 192.1 KB           | 192.1 KB            |
| About                 | 179.8 KB           | 179.8 KB            |

Phase 5 added tests, not browser code: its fixes (names, focusable regions, layout at 320px, font loading) changed markup and CSS only.

### End-to-end sweep

`pnpm test:e2e` ([conventions §14](conventions.md#14-testing)) loads every route at 320, 768 and 1280px in light and dark: 1,413 loads on the build with drafts (about 11–15 minutes locally on 6 workers) and 42 on the build without. On the final run the largest layout shift on any route was 0.0000, with no sideways scroll, console error or axe-core violation. On its first runs the sweep found what Phase 5 fixed: names that left out visible text, scroll areas the keyboard could not reach, sideways scroll at 320px, and the font-swap shifts.

## Bangla digits (2026-11-19)

Hind Siliguri's ১ reads poorly, so the Bangla digits come from their own face ([ADR-0017](../decisions/ADR-0017-one-font-for-text-and-headings.md), [design.md](../design.md#fonts)). The final setup, **files-swap**: width-matched digits (Noto Sans Bengali's shapes, Hind Siliguri's advance widths and line metrics) as three separate woff2 files, `font-display: swap`, not preloaded. It was measured with the earlier attempts on local production builds with drafts (`next start`, which serves HTTP/1.1, so at most 6 connections per host), against the Hind-only build (`dde4d8a`). A deployed-preview measurement (HTTP/2) is still to come.

### Font loading

`pnpm measure:fonts http://localhost:3419 --runs 5` ([method](#targets-and-measurement)): `/`, `/roadmap`, `/contents`, 15 loads per profile. Each cell is the number of loads in which a face fell back.

| Profile       | Face                 | Hind only   | Inlined width-matched, `swap` | **Files-swap (final)** |
| ------------- | -------------------- | ----------- | ----------------------------- | ---------------------- |
| No throttling | Hind 400 / 500 / 600 | 0 / 1 / 1   | 0 / 0 / 0                     | 0 / 0 / 0              |
|               | JetBrains Mono       | 1           | 0                             | 0                      |
|               | first paint          | 0.25–0.32 s | 0.18–0.20 s                   | 0.14–0.19 s            |
| Fast 4G       | Hind 400 / 500 / 600 | 0 / 0 / 5   | 0 / 0 / 0                     | 0 / 0 / 5              |
|               | JetBrains Mono       | 0           | 0                             | 0                      |
|               | first paint          | 0.70–0.75 s | 0.68–0.71 s                   | 0.70–0.76 s            |
| Slow 4G       | Hind 400 / 500 / 600 | 0 / 0 / 15  | 0 / 0 / 15                    | 0 / 0 / 15             |
|               | JetBrains Mono       | 15          | 15                            | 15                     |
|               | first paint          | 1.67–1.76 s | 1.85–1.95 s                   | 1.67–1.77 s            |
| CSS           | files, gzip          | 1, 14.0 KB  | 1, 20.2 KB                    | 1, 14.0 KB             |

- With `swap` the digits never stay in the fallback: they swap in when their file arrives. The probe of `measure:fonts` then drew every face once the page had loaded, which also fetched digit weights the page never used, so for files-swap its "fonts done" column (up to 2.85 s on Fast 4G and 8.4 s on Slow 4G) overstated when the page's own digit files arrived (the script has since been fixed: it reads the timings first and leaves unused faces undrawn). Those were timed separately, from the resource timings of the files the page itself requested (5 loads per page and profile, median and range):

  | Profile       | First paint    | Digit files done | Hind's digits shown before the swap |
  | ------------- | -------------- | ---------------- | ----------------------------------- |
  | No throttling | 192–244 ms     | 69–97 ms         | 0 ms (done before the first paint)  |
  | Fast 4G       | 692–740 ms     | 720–903 ms       | 17–143 ms (0–193 ms)                |
  | Slow 4G       | 1,676–1,772 ms | 2,679–2,705 ms   | 944–1,011 ms (923–1,035 ms)         |

- Preloaded fonts are unchanged by the digits: Hind Siliguri's six files and JetBrains Mono's Latin file, 7 files, 180.4 KB. A page fetches only the digit weights it shows (1,752–1,772 B each).
- Hind Siliguri 600 misses in about a third of local Fast 4G loads (5 of 15, all on `/contents`) and in every Slow 4G load, with or without the digits; 400 and 500 never missed.

Earlier attempts, same method:

| Profile       | Face                   | Hind only      | Noto digits, 3 preloaded files, `optional` | Noto inlined, `optional`, own stylesheet | Noto inlined, `block`, one stylesheet |
| ------------- | ---------------------- | -------------- | ------------------------------------------ | ---------------------------------------- | ------------------------------------- |
| No throttling | digits 400 / 500 / 600 | n/a            | 0 / 0 / 0                                  | 3 / 13 / 3                               | 0 / 0 / 0                             |
|               | Hind 400 / 500 / 600   | 0 / 1 / 1      | 0 / 0 / 0                                  | 0 / 0 / 0                                | 0 / 0 / 0                             |
|               | JetBrains Mono         | 1              | 0                                          | 0                                        | 0                                     |
|               | first paint            | 0.25–0.32 s    | 0.20–0.27 s                                | 0.20 s                                   | 0.18–0.19 s                           |
| Fast 4G       | digits 400 / 500 / 600 | n/a            | 8 / 10 / 11                                | 0 / 10 / 0                               | 0 / 0 / 0                             |
|               | Hind 400 / 500 / 600   | 0 / 0 / 5      | 0 / 0 / 7                                  | 0 / 0 / 0                                | 0 / 0 / 0                             |
|               | JetBrains Mono         | 0              | 0                                          | 0                                        | 0                                     |
|               | first paint            | 0.70–0.75 s    | 0.68–0.79 s                                | 0.70–0.78 s                              | 0.68–0.71 s                           |
| Slow 4G       | digits 400 / 500 / 600 | n/a            | 15 / 15 / 15                               | 13 / 15 / 13                             | 0 / 0 / 0                             |
|               | Hind 400 / 500 / 600   | 0 / 0 / 15     | 0 / 0 / 15                                 | 0 / 0 / 10                               | 0 / 0 / 15                            |
|               | JetBrains Mono         | 15             | 15                                         | 2                                        | 15                                    |
|               | first paint            | 1.67–1.76 s    | 1.68–1.76 s                                | 2.12 s                                   | 1.83–1.95 s                           |
| CSS           | files, gzip            | 1, about 14 KB | 1, 14.0 KB                                 | 2, 19.3 KB                               | 1, 20.2 KB                            |

- As preloaded files, Noto's digits queued behind the body font's preloads and missed, and pushed Hind Siliguri 600's Fast 4G misses from 5 to 7; inlined with `optional`, the face needed for the first paint missed because its decode starts at first use and Chrome paints before it ends; as its own stylesheet it added a second render-blocking request (Slow 4G first paint about 0.45 s later); inlined with `block`, the digits rendered in every load but cost about 6 KB gzip of CSS and re-wrapped text (below).

### Layout shift

- **Re-wrapping with Noto's own widths.** Noto's digits are all 0.592 em wide, Hind's are proportional (১ is 0.500 em), so "১১ নভেম্বর, ২০২৬" is about 11% wider in Noto. With the inlined `block` variant, text laid out with Hind's digits during the block period re-wrapped when the face arrived: 5 lesson routes at 320 px, run 10 times each with 3 end-to-end workers, failed 9 of 100 times with shifts of 0.066–0.095 (the Hind-only build: 100 of 100 passed, shift 0). With width-matched digits, inlined or as files, the same 100 runs all pass, largest shift 0.0005.
- **CLS script.** A first visit per load (fresh context, cache disabled, 4× CPU slowdown), `/`, `/roadmap` and the `use-effect` lesson at 320 and 375 px, 3 runs per profile and width, 54 loads per build:

  | Build                  | Loads with a shift | Largest | Source                                                                                                 |
  | ---------------------- | ------------------ | ------- | ------------------------------------------------------------------------------------------------------ |
  | Hind only              | 0                  | 0       |                                                                                                        |
  | Inlined, width-matched | 13                 | 0.0092  | the lesson's bookmark and done buttons moving 44 px, which also happens on the Hind-only build (below) |
  | Files-swap (final)     | 12                 | 0.0003  | digit text on Slow 4G, such as "১৭০/১৭০০/১৭০", getting narrower when the face arrives (57.8 → 53.1 px) |

  Width matching holds against Hind's digits. Where a Hind Siliguri face itself missed the first paint (600 always does on Slow 4G), the digits start in the system fallback, whose widths differ, so they change width when the digits face arrives.

- **End-to-end sweep, files-swap.** 1,462 + 54 passed. 89 of 235 routes recorded a shift above 0, most 0.0005 or less; the largest, 0.0077 on `/learn/tools/npm`, reproduced once in 10 loads at 768 px with 4× CPU (the "start this topic" block moving 74 px at 489 ms) and not in 20 loads of the Hind-only build; the cause is not confirmed, most likely the same fallback-width case.
- **Not from the digits.** On the lesson page at 375 px with 4× CPU, the Hind-only build shows two shifts after the first paint while the page hydrates: the breadcrumb's last-but-one item wrapping to a second line (0.0094) and the bookmark and done buttons moving 44 px down (0.0111, over the 0.01 limit). They are to be fixed separately.

### Lighthouse

`pnpm dlx lighthouse@13.6.0` with DevTools (applied) throttling: a 4× slower CPU and a real slow network. 3 runs each, median and range, Chrome 157.

| Page                  | Hind only: LCP (FCP)      | Inlined width-matched, `swap` | **Files-swap (final)**       |
| --------------------- | ------------------------- | ----------------------------- | ---------------------------- |
| Home                  | 2.84 s, 2.49–3.17 (= LCP) | 3.02 s, 2.58–3.02 (= LCP)     | 2.63 s, 2.58–2.85 (= LCP)    |
| Lesson (`use-effect`) | 2.58 s, 2.27–2.62 (= LCP) | 2.78 s, 2.56–3.12 (FCP 2.56)  | 2.66 s, 2.28–3.05 (FCP 2.28) |
| Map (`/roadmap`)      | 2.38 s, 2.35–2.40 (= LCP) | 2.63 s, 2.60–2.97 (= LCP)     | 2.37 s, 2.23–2.39 (= LCP)    |

- CLS was 0 in every run except 0.0003 on the lesson with files-swap.
- Inlined, the stylesheet grows from about 14 to 20 KB gzip and FCP and LCP come about 0.2–0.25 s later; as files they stay within the Hind-only build's range. (The earlier inlined `block` variant measured LCP about 0.7 s later on Home, with text held invisible during the block period, and Lighthouse's simulated throttling reported 3.9 s on Home and the Map because it modelled the inlined `data:` fonts as downloads.)
- Lighthouse's default simulated throttling (`pnpm lighthouse`) measured the Hind-only build at LCP 0.93 s (Home), 0.98 s (lesson) and 0.91 s (Map), and the inlined width-matched build at 0.96, 1.07 and 0.91 s.
- These are local numbers on HTTP/1.1; the deployed preview (HTTP/2) is still to be measured.
