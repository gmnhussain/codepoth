# ADR-0017: One font for text and headings

- Status: accepted
- Date: 2026-11-18

## Context

The site loaded three web fonts with `next/font` and `font-display: optional` ([performance.md](../development/performance.md#fonts)): Anek Bangla for headings (a variable font, preloaded: a 152 KB Bangla file and a 42 KB Latin file), Hind Siliguri for body text (400, 500, 600) and JetBrains Mono for code. With `optional`, a face that is not ready by the first paint is never swapped in on that document: it stays in the fallback for the whole page view, including client-side navigations, until the next full page load. No ADR named the fonts; they were set in [design.md](../design.md#fonts).

Lighthouse on localhost showed every font finishing before the first paint. Measured on the live site (`codepoth.vercel.app`) on 2026-11-18 with Playwright (a fresh browser context per load, cache disabled, `/`, `/roadmap` and `/contents`, 3 runs each per profile, the method of `pnpm measure:fonts`):

- **No throttling:** first paint about 0.4–0.5 s; the preloaded fonts arrive before it, and headings and body render in their web fonts.
- **Fast 4G** (Chrome DevTools preset, 165 ms, 9 Mbps): first paint about 0.93 s. Hind Siliguri's files arrive at 0.59–0.89 s and render. Anek Bangla's Bangla file arrives at about 1.1 s, past `optional`'s window of about 100 ms, so headings stayed in the system font in 9 of 9 loads (8 of 9 in a second run of `pnpm measure:fonts`).
- **Slow 4G** (562.5 ms, 1.6 Mbps): headings in the system font in 9 of 9 loads; body text renders.

So on a mobile connection, most first visits paid for Anek Bangla and never showed it, and headings were set in whatever Bangla font the system had, next to body text in Hind Siliguri.

## Decision

- Remove Anek Bangla. Headings use Hind Siliguri, the body font.
- Keep the `font-heading` utility as an alias of the body font (`--font-heading: var(--font-body), sans-serif` in `globals.css`), so a separate heading font later is a change to that line plus loading the font.
- Hind Siliguri keeps loading 400, 500 and 600 only; 700 is not added. Headings that were `font-bold` are `font-semibold`, and their size carries the hierarchy. No text in Hind Siliguri asks for 700 (`b` and `strong` are already semibold), so none renders in a synthesized bold. Code may still be bold: JetBrains Mono is variable up to 800.

## Alternatives considered

- **Keep the variable Anek Bangla.** Rejected: about 194 KB preloaded on every page, for a face that most first visits on Fast 4G or slower never render.
- **Load Anek Bangla as static weights (500–700).** Not measured. Each weight is its own Bangla file, so it is still extra bytes competing with the body font for the same window, and it would still miss on slow connections.
- **`font-display: swap` for the heading font.** Rejected: with `swap`, the end-to-end sweep measured layout shifts of up to 0.26 on slow loads at 320 px, from text re-wrapping when the web font arrives ([performance.md](../development/performance.md#fonts)).

## Consequences

- About 190 KB less per page: the preloaded fonts go from 9 files, 374.5 KB, to 7 files, 180.4 KB, as built.
- Headings render in the web font whenever body text does, and the page uses one Bangla face throughout instead of a system font next to Hind Siliguri.
- Headings lose their separate face; the design's hierarchy rests on size and weight 600.
- A future heading font must be measured on a deployed site with `pnpm measure:fonts` on Fast 4G before it is adopted.
