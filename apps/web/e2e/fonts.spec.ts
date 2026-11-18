import type { Page } from "@playwright/test"

import { expect, test } from "./support/test"

/** The code font's `font-family` in next/font's `@font-face` rules. */
const CODE_FONT_FAMILY = "JetBrains Mono"

/** Absolute URLs of every file the page's `@font-face` rules for `family` use. */
function fontFaceUrls(page: Page, family: string): Promise<string[]> {
  return page.evaluate((wanted) => {
    const urls: string[] = []
    for (const sheet of Array.from(document.styleSheets)) {
      const base = sheet.href ?? document.baseURI
      for (const rule of Array.from(sheet.cssRules)) {
        if (!(rule instanceof CSSFontFaceRule)) continue
        const name = rule.style
          .getPropertyValue("font-family")
          .replace(/^["']|["']$/g, "")
        if (name !== wanted) continue
        const src = rule.style.getPropertyValue("src")
        for (const match of src.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
          const url = match[1]
          if (url !== undefined) urls.push(new URL(url, base).href)
        }
      }
    }
    return urls
  }, family)
}

/** Absolute URLs of the page's `<link rel="preload" as="font">` elements. */
function preloadedFontUrls(page: Page): Promise<string[]> {
  return page
    .locator('link[rel="preload"][as="font"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href))
}

/** Narrow and wide letters: equal widths only in a monospaced face. */
const NARROW = "iiiiiiiiii"
const WIDE = "MMMMMMMMMM"
/**
 * A Bangla word as in a code comment (sample text, not a UI label). No
 * spaces or Latin: those rightly come from the monospaced face.
 */
const BANGLA = "পরিবর্তনশীল"

/**
 * Width of `text` in a span added to the page, styled by `className` or,
 * when `fontFamily` is given, by that `font-family` alone.
 */
function textWidth(
  page: Page,
  text: string,
  style: { className?: string; fontFamily?: string }
): Promise<number> {
  return page.evaluate(
    ({ text, className, fontFamily }) => {
      const span = document.createElement("span")
      if (className !== undefined) span.className = className
      if (fontFamily !== undefined) span.style.fontFamily = fontFamily
      span.style.position = "absolute"
      span.style.whiteSpace = "nowrap"
      span.textContent = text
      document.body.append(span)
      const { width } = span.getBoundingClientRect()
      span.remove()
      return width
    },
    { text, ...style }
  )
}

test.describe("fonts", { tag: "@both" }, () => {
  // With `display: optional`, a font that is not preloaded misses the first
  // paint and stays in the fallback for the whole visit
  // (docs/development/performance.md#fonts).
  test("the code font is preloaded", async ({ page }) => {
    await page.goto("/")
    const faces = await fontFaceUrls(page, CODE_FONT_FAMILY)
    expect(faces, "@font-face rules for the code font").not.toEqual([])
    const preloaded = await preloadedFontUrls(page)
    expect(preloaded.filter((url) => faces.includes(url))).not.toEqual([])
  })

  // A reader whose code font misses the first paint (slow connection, or
  // the file fails) sees the fallback stack in globals.css.
  test.describe("without the code font", () => {
    test.beforeEach(async ({ page, browser, browserProblems }) => {
      // The code font's files, read from a separate first visit.
      const probe = await browser.newContext()
      const probePage = await probe.newPage()
      await probePage.goto("/")
      const blocked = new Set(await fontFaceUrls(probePage, CODE_FONT_FAMILY))
      await probe.close()
      expect(
        blocked.size,
        "@font-face files for the code font"
      ).toBeGreaterThan(0)

      browserProblems.allow(/ERR_BLOCKED_BY_CLIENT/)
      await page.route("**/*.woff2", (route) =>
        blocked.has(route.request().url())
          ? route.abort("blockedbyclient")
          : route.fallback()
      )
      await page.goto("/")
      await page.evaluate(() => document.fonts.ready)
    })

    test("Latin in code is still monospaced", async ({ page }) => {
      const narrow = await textWidth(page, NARROW, { className: "font-mono" })
      const wide = await textWidth(page, WIDE, { className: "font-mono" })
      expect(narrow).toBeCloseTo(wide, 0)
    })

    test("Bangla in code renders in the body font", async ({ page }) => {
      const inCode = await textWidth(page, BANGLA, { className: "font-mono" })
      const inBody = await textWidth(page, BANGLA, {
        fontFamily: "var(--font-body)",
      })
      expect(inCode).toBeCloseTo(inBody, 0)
    })
  })
})
