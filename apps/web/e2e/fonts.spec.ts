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
})
