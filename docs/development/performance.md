# Performance

**Ship HTML and CSS, and as little JavaScript as possible: everything that can be computed at build time is computed at build time.**

Every route is pre-rendered ([ADR-0004](../decisions/ADR-0004-vercel-ssg-not-static-export.md)). The rules below keep those pages fast once they reach the reader. Performance work is measured before and after ([conventions](conventions.md#1-principles)).

## Rendering

- Server Components by default. Client components are small islands only where the browser is needed: quiz, mark-done and bookmark buttons, theme toggle, search trigger, progress overlays.
- Islands get their labels as data, only the groups in scope (`LabelScope` + `useT()`), never the whole label set in the JavaScript ([ADR-0013](../decisions/ADR-0013-labels-in-client-islands.md)); measured on 2026-11-15, this took about 4.4 KB gzip off every route's First Load JS.
- Reader progress is read from localStorage after hydration through a `useSyncExternalStore` hook, so the server HTML is the same for every reader and there is no hydration mismatch. Storage rules: [conventions](conventions.md#10-frontend).
- Reading time, the table of contents and prev/next links are computed at build time, never in the browser.

## Fonts

- Load every font with `next/font`, with `subsets: ["bengali", "latin"]` for the Bangla fonts and `display: "swap"`.
- Anek Bangla is a variable font: load it once as a variable font, not one file per weight.
- Font families and weights: [design.md](../design.md#fonts).

## Build-time rendering instead of client libraries

- Code highlighting with Shiki at build time. Shiki is never shipped to the browser.
- No `mermaid.js` in the browser.
- The roadmap map is an inline SVG generated at build time from `content/map.json`. No client-side graph or map library; only the reader's progress highlights are added on the client.
- Diagrams are SVG.

## Loaded only when needed

- Pagefind is imported dynamically on the first ⌘K (or search button) press, not on page load.
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

- Lighthouse CI on Home, Lesson and Map pages with score thresholds (planned; CI gate in [conventions](conventions.md#15-ci-gates-every-pull-request)).
- `@next/bundle-analyzer` to inspect client bundles when a page's JavaScript grows (planned).
- Turborepo remote cache on Vercel to keep builds fast.

### Known layout shift

- **Page:** `/contents#track-…` (a link to a closed track, e.g. `/contents#track-frontend`), measured 2026-11-15 in headless Chrome on a local production build.
- **CLS:** cold load (browser cache cleared) with JavaScript on: 0.36 at 1280px, 0.62 at 768px. Warm load: 0. JavaScript off: 0. Loads without a hash: 0.
- **Cause:** the track's `#track-…` target sits inside its closed `<details>`, and Chrome opens it itself ("ancestor details revealing") once parsing ends. On a cold load with JavaScript on, Chrome first paints a frame already scrolled to the still-closed track, with the closed tracks below it in view; opening the track then pushes them down. Without JavaScript, parsing ends before the first paint, so that frame does not exist. Opening the track from the island instead (the earlier behaviour) measured the same.
- **Status:** left for a performance trace in Phase 5, to find what triggers the early paint.

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

- They do not delay LCP: every `@font-face` uses `font-display: swap` with a metric-matched fallback (`next/font`), Lighthouse's font-display check passes, and in these runs every font had finished (94–147 ms) before the first paint (205–228 ms observed), where LCP equals FCP. The LCP element is text: Home's heading, the lesson's description, the Map's summary.
- JetBrains Mono is not preloaded but loads on all three pages, because each shows some monospace text (track numbers, lesson numbers, code). On a slow connection that is 40 KB fetched after the CSS.
- The largest single file is Anek Bangla's Bangla subset (152.8 KB, the variable font). It is the first candidate if font bytes ever need to shrink.

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
