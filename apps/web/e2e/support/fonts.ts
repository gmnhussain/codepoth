import type { Browser, Page } from "@playwright/test"

import type { BrowserProblems } from "./test"
import { expect } from "./test"

/** The body font's `font-family` in next/font's `@font-face` rules. */
export const BODY_FONT_FAMILY = "Hind Siliguri"
/**
 * The Bangla digits face's `font-family`
 * (packages/ui/src/styles/bangla-digits/bangla-digits.css).
 */
export const DIGITS_FONT_FAMILY = "banglaDigits"

/** One `@font-face` rule of the page, its `url()`s made absolute. */
export type FontFaceRule = {
  readonly family: string
  readonly weight: string
  readonly unicodeRange: string
  /** The `src` descriptor with every `url()` absolute. */
  readonly src: string
  readonly urls: readonly string[]
}

/** The page's `@font-face` rules for `family`. */
export function fontFaceRules(
  page: Page,
  family: string
): Promise<FontFaceRule[]> {
  return page.evaluate((wanted) => {
    const URL_PATTERN = /url\(\s*["']?([^"')]+)["']?\s*\)/g
    const found: FontFaceRule[] = []
    for (const sheet of Array.from(document.styleSheets)) {
      const base = sheet.href ?? document.baseURI
      for (const rule of Array.from(sheet.cssRules)) {
        if (!(rule instanceof CSSFontFaceRule)) continue
        const name = rule.style
          .getPropertyValue("font-family")
          .replace(/^["']|["']$/g, "")
        if (name !== wanted) continue
        const urls: string[] = []
        const src = rule.style
          .getPropertyValue("src")
          .replace(URL_PATTERN, (_, url: string) => {
            const absolute = new URL(url, base).href
            urls.push(absolute)
            return `url("${absolute}")`
          })
        found.push({
          family: name,
          weight: rule.style.getPropertyValue("font-weight") || "400",
          unicodeRange:
            rule.style.getPropertyValue("unicode-range") || "U+0-10FFFF",
          src,
          urls,
        })
      }
    }
    return found
  }, family)
}

/** Absolute URLs of every file the page's `@font-face` rules for `family` use. */
export async function fontFaceUrls(
  page: Page,
  family: string
): Promise<string[]> {
  return (await fontFaceRules(page, family)).flatMap((rule) => rule.urls)
}

/**
 * Blocks every file of `family`'s `@font-face` rules for `page`, then opens
 * `path` there. The files are read from a separate first visit.
 */
export async function openWithoutFont(
  page: Page,
  browser: Browser,
  browserProblems: BrowserProblems,
  family: string,
  path: string
): Promise<void> {
  const probe = await browser.newContext()
  const probePage = await probe.newPage()
  await probePage.goto(path)
  const blocked = new Set(await fontFaceUrls(probePage, family))
  await probe.close()
  expect(blocked.size, `@font-face files for ${family}`).toBeGreaterThan(0)

  browserProblems.allow(/ERR_BLOCKED_BY_CLIENT/)
  await page.route("**/*.woff2", (route) =>
    blocked.has(route.request().url())
      ? route.abort("blockedbyclient")
      : route.fallback()
  )
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready)
}
