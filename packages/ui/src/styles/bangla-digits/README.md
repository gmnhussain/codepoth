# Bangla digits

The site's text font, Hind Siliguri, draws ১ as a hook that is hard to read in counts such as ১২/৪০. So the ten Bangla digits ০–৯ (U+09E6–U+09EF) come from their own face, "Bangla Digits", at weights 400, 500 and 600 ([ADR-0017](../../../../../docs/decisions/ADR-0017-one-font-for-text-and-headings.md)):

- **Shapes from Noto Sans Bengali, widths from Hind Siliguri.** Every digit has Hind Siliguri's advance width at the same weight, with Noto's outline centred in it, and the face has Hind Siliguri's line metrics. Text with these digits therefore lays out exactly as it does with Hind's digits: when the face takes over, glyph shapes change but no line re-wraps and no line grows. ২ is wider than Hind's ২, so it is narrowed horizontally just enough to keep 20 units (of 1,000) of side bearing: to 92.4% at 400, 89.7% at 500 and 86.4% at 600. The other nine fit unchanged.
- **Separate files, not preloaded.** [`bangla-digits.css`](bangla-digits.css) holds `--font-digits` and one `@font-face` per weight, each `src` the woff2 file of that weight in this folder; `../globals.css` imports it, and the build emits the files with hashed names. They are not preloaded, so they do not queue in front of the body font's files, and not inlined, so the render-blocking stylesheet stays small; a page downloads only the weights it shows digits in. The faces use `font-display: swap`, which is safe because the widths match: until a face arrives the digits show in Hind's shapes, then change shape in place.
- **Where it applies.** `globals.css` puts the face first in `font-sans` and `font-heading` and right after the code font in `font-mono`, so digits in text, headings, chips and code all use it; `unicode-range` leaves every other character to the faces after it.

Files:

- `bangla-digits-400.woff2`, `-500.woff2`, `-600.woff2`: the modified faces (about 1.8 KB each) that `bangla-digits.css` serves.
- `noto-sans-bengali-digits-400.woff2`, `-500.woff2`, `-600.woff2`: the unmodified Noto Sans Bengali digits, the input of the generator; kept so that the faces can be regenerated from the same outlines without downloading Noto again. Each holds the ten digits plus the space and `.notdef` glyphs that Google's subsetter always adds.
- `make-digits.py`: the generator (below).
- `OFL.txt`: the SIL Open Font License 1.1 that Noto Sans Bengali is released under, from [google/fonts](https://github.com/google/fonts/blob/main/ofl/notosansbengali/OFL.txt). It must stay next to the files. It names no Reserved Font Name.

## Licence: a Modified Version

The digit faces are a Modified Version of Noto Sans Bengali under the OFL: cut down to the digits, with changed advance widths, outlines moved (and ২ narrowed), Hind Siliguri's vertical metrics, and the kerning, shaping and hinting data removed. As the OFL asks of modified fonts, they do not use the original name: the name table says "Bangla Digits" (PostScript name `BanglaDigits-Regular`, `-Medium`, `-SemiBold`). The copyright and licence entries of the original are kept, and name ID 10 records the modification. Hind Siliguri's files are not part of these faces: only its advance widths and line metrics are read.

## Regenerating

1. **The Noto input** (only if Noto Sans Bengali changes). Download it from the Google Fonts CSS API, one request per weight, with next/font's user agent (`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36`), so the response points at a woff2 file:

   ```
   https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400&text=%E0%A7%A6%E0%A7%A7%E0%A7%A8%E0%A7%A9%E0%A7%AA%E0%A7%AB%E0%A7%AC%E0%A7%AD%E0%A7%AE%E0%A7%AF
   ```

   The same request with `wght@500` and `wght@600` gives the other two weights. `text=` is "০১২৩৪৫৬৭৮৯" URL-encoded. Save the `src: url(…)` file of each response as `noto-sans-bengali-digits-<weight>.woff2`. One request per weight matters: Noto Sans Bengali is a variable family, and a request for several weights (`wght@400;500;600`) returns one variable file for all of them instead of three static ones. Downloaded on 2026-11-19.

2. **The modified faces** (also whenever Hind Siliguri's metrics change). [fontTools](https://github.com/fonttools/fonttools) is a one-off tool here, not a project dependency; install it in a throwaway virtual environment outside the repository (Python 3), then run the generator from this folder:

   ```
   python -m venv ~/fontvenv
   ~/fontvenv/Scripts/python -m pip install fonttools brotli   # Windows; ~/fontvenv/bin/python elsewhere
   ~/fontvenv/Scripts/python make-digits.py
   ```

   It reads Hind Siliguri's digits for each weight from the same CSS API, writes `bangla-digits-<weight>.woff2` and prints each digit's advance, ink width, any narrowing and its side bearings.

3. **Check.** `bangla-digits.css` points at the files by name, so it needs no change. The end-to-end check "Bangla digits are exactly as wide and tall as the body font's" (`apps/web/e2e/fonts.spec.ts`) fails if the widths or line metrics drift from Hind Siliguri's.
