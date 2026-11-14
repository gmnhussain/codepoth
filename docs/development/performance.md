# Performance

**Ship HTML and CSS, and as little JavaScript as possible: everything that can be computed at build time is computed at build time.**

Every route is pre-rendered ([ADR-0004](../decisions/ADR-0004-vercel-ssg-not-static-export.md)). The rules below keep those pages fast once they reach the reader. Performance work is measured before and after ([conventions](conventions.md#1-principles)).

## Rendering

- Server Components by default. Client components are small islands only where the browser is needed: quiz, mark-done and bookmark buttons, theme toggle, search trigger, progress overlays.
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
