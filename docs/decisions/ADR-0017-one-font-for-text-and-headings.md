# ADR-0017: One font for text and headings

- Status: accepted
- Date: 2026-11-19

## Context

The site loaded three web fonts with `next/font` and `font-display: optional` ([performance.md](../development/performance.md#fonts)): Anek Bangla for headings (a variable font, preloaded: a 152 KB Bangla file and a 42 KB Latin file), Hind Siliguri for body text (400, 500, 600) and JetBrains Mono for code. With `optional`, a face that is not ready by the first paint is never swapped in on that document: it stays in the fallback for the whole page view, including client-side navigations, until the next full page load. No ADR named the fonts; they were set in [design.md](../design.md#fonts).

Lighthouse on localhost showed every font finishing before the first paint. Measured on the live site (`codepoth.vercel.app`) on 2026-11-18 with Playwright (a fresh browser context per load, cache disabled, `/`, `/roadmap` and `/contents`, 3 runs each per profile, the method of `pnpm measure:fonts`):

- **No throttling:** first paint about 0.4–0.5 s; the preloaded fonts arrive before it, and headings and body render in their web fonts.
- **Fast 4G** (Chrome DevTools preset, 165 ms, 9 Mbps): first paint about 0.93 s. Hind Siliguri's files arrive at 0.59–0.89 s and render. Anek Bangla's Bangla file arrives at about 1.1 s, past `optional`'s window of about 100 ms, so headings stayed in the system font in 9 of 9 loads (8 of 9 in a second run of `pnpm measure:fonts`).
- **Slow 4G** (562.5 ms, 1.6 Mbps): headings in the system font in 9 of 9 loads; body text renders.
  - Correction (2026-11-19): "body text renders" overstates it. The probe of `measure:fonts` then measured Hind Siliguri's Bangla faces with a sample containing a space; the space rendered in Hind's Latin face, which loads in time, so Bangla faces that had fallen back still read as real. Chrome DevTools shows body text on Slow 4G with its Bangla in Nirmala UI, the system fallback. The probe is fixed; the deployed-preview measurement with it will give the real numbers ([performance.md](../development/performance.md#fonts)).

So on a mobile connection, most first visits paid for Anek Bangla and never showed it, and headings were set in whatever Bangla font the system had, next to body text in Hind Siliguri.

A second problem showed once Hind Siliguri set all text: its Bangla digit ১ is drawn as a hook that reads poorly, so counts such as ১২/৪০ are hard to read.

## Decision

- Remove Anek Bangla. Headings use Hind Siliguri, the body font.
- Keep the `font-heading` utility as an alias of the body font, so a separate heading font later is a change to its line in `globals.css` plus loading the font.
- Hind Siliguri keeps loading 400, 500 and 600 only; 700 is not added. Headings that were `font-bold` are `font-semibold`, and their size carries the hierarchy. No text in Hind Siliguri asks for 700 (`b` and `strong` are already semibold), so none renders in a synthesized bold. Code may still be bold: JetBrains Mono is variable up to 800.
- **Bangla digits ০–৯ come from width-matched faces, "Bangla Digits".** Each has Noto Sans Bengali's digit shapes with Hind Siliguri's advance widths and line metrics at the same weight (400, 500, 600). Text therefore lays out the same with these digits as with Hind's, so a late face changes the digits' shapes but never a line break or a line height. Every outline is centred in Hind's advance; ২ is wider than Hind's ২ and is narrowed horizontally to keep a small side bearing (to 92.4%, 89.7% and 86.4% at 400, 500 and 600). Kerning, shaping and hinting data are removed.
  - The faces are three separate woff2 files of about 1.8 KB in `packages/ui/src/styles/bangla-digits/`, served through `@font-face` with `url()` in `bangla-digits.css`, which `globals.css` imports. `unicode-range: U+09E6-09EF`, `font-display: swap`, no preload: a page downloads only the weights it shows digits in, after the body font's preloads.
  - The family comes first in `font-sans` and `font-heading` and right after the code font in `font-mono`, so digits in text, headings, chips and code use it, and every other character goes on to the faces after it.
  - The faces are generated once by `make-digits.py` with fontTools, offline (fontTools is a one-off tool, not a project dependency), from the unmodified Noto digits kept next to it and Hind Siliguri's metrics read from Google Fonts. Licence: SIL OFL 1.1, no Reserved Font Name; as a Modified Version the faces are renamed "Bangla Digits", keep the copyright and licence entries and record the modification in the name table (README next to the files).

## Alternatives considered

- **Keep the variable Anek Bangla.** Rejected: about 194 KB preloaded on every page, for a face that most first visits on Fast 4G or slower never render.
- **Anek Bangla as the one font for all text** (chosen for its digits in a side-by-side render). Rejected. Through `next/font`, the weight list still gets the 156 KB variable file, because Google Fonts returns one variable file for a request with several weights of a variable family. On Fast 4G, every Anek face fell back in 15 of 15 local loads, and it pushed JetBrains Mono out too (14 of 15 fallbacks, against 0 of 15 with Hind Siliguri).
- **Anek Bangla as static weights.** Google serves a static file per weight only when each weight is requested on its own: about 165 KB of Bangla for 400–600 in all, no saving over the variable file, and the files share one connection, so they would not arrive sooner.
- **Noto Sans Bengali for all text.** Rejected: through `next/font` it is a 108 KB variable file for the three weights, with the same variable-file behaviour.
- **`font-display: swap` for the heading font.** Rejected: with `swap`, the end-to-end sweep measured layout shifts of up to 0.26 on slow loads at 320 px, from text re-wrapping when the web font arrives ([performance.md](../development/performance.md#fonts)).
- **Keep Hind Siliguri's digits (no digits face).** Rejected: ১ misreads, and the final setup measured within the baseline's range for first paint and LCP.
- **Another digits font.** Not pursued: any font whose digit widths differ from Hind Siliguri's re-wraps lines when it arrives late, so it would need the same width matching; Noto Sans Bengali has static 400–600 cuts, matching shapes and no Reserved Font Name.

Earlier attempts at the digits face, each measured locally (`next start`, [performance.md](../development/performance.md#bangla-digits-2026-11-19)):

- **Noto's own digits as separate preloaded files, `optional`** (`next/font/local`). Rejected: on Fast 4G the face missed the first paint in 8–11 of 15 loads per weight, and the three extra preloads queued in front of the body font and pushed Hind Siliguri 600's misses from 5 to 7 of 15.
- **Noto's digits inlined as base64, `optional`.** Rejected: the face needed for the first paint missed it almost every time (the 500 weight in 10 of 10 loads on `/` and `/roadmap`, even unthrottled): the decode starts at first use, Chrome paints before it ends, and `optional` keeps the fallback for the page view.
- **Inlined in a stylesheet of its own** (imported by the layout). Rejected: Turbopack emits it as a second render-blocking CSS file; the Slow 4G first paint moved about 0.45 s later.
- **Noto's digits inlined, `font-display: block`.** Rejected: Noto's digits are all 0.592 em wide and Hind's are proportional (১ is 0.500 em), so text laid out with Hind's digits during the block period re-wrapped when the face arrived: layout shifts of 0.066–0.095 at 320 px under load (9 of 100 end-to-end loads), and text held invisible pushed LCP about 0.7 s later on Home with DevTools throttling.
- **The width-matched faces inlined, `swap`.** Rejected: the render-blocking stylesheet grew from about 14 to 20 KB gzip, and FCP and LCP came about 0.2–0.25 s later with DevTools throttling. As separate files the stylesheet keeps its size and FCP and LCP stay within the baseline's range.

## Consequences

- About 190 KB less per page from removing Anek Bangla: the preloaded fonts go from 9 files, 374.5 KB, to 7 files, 180.4 KB, as built. The digits add no preload and leave the stylesheet's size unchanged; a page fetches one to three files of about 1.8 KB.
- Headings render in the web font whenever body text does, and the page uses one Bangla face throughout instead of a system font next to Hind Siliguri. Headings lose their separate face; the design's hierarchy rests on size and weight 600.
- On a first visit Hind Siliguri's digits show until the digits face arrives and swaps in: none unthrottled, about 0.1 s on Fast 4G and about 1 s on Slow 4G (local measurement).
- Small layout shifts, up to about 0.008, remain where a Hind Siliguri face itself missed the first paint: the digits then start in the system fallback, whose widths differ, and change width when the digits face arrives. The end-to-end limit is 0.01.
- ২ is visibly narrower than Noto's at 600.
- A bold Bangla digit in code is synthesized from the 600 face, because the digits face has no 700.
- If Hind Siliguri's metrics or Noto Sans Bengali's digits change, the faces are regenerated with `make-digits.py`; the end-to-end check that compares the widths and line heights with Hind's catches a drift.
- A future heading font must be measured on a deployed site with `pnpm measure:fonts` on Fast 4G before it is adopted. The digits measurements are local (`next start`, HTTP/1.1); a deployed-preview measurement is still to come.
