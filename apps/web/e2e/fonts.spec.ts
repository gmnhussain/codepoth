import type { Browser, Page } from "@playwright/test"

import type { BrowserProblems } from "./support/test"
import { expect, test } from "./support/test"

/** The code font's `font-family` in next/font's `@font-face` rules. */
const CODE_FONT_FAMILY = "JetBrains Mono"
/**
 * The Bangla digits face's `font-family`
 * (packages/ui/src/styles/bangla-digits/bangla-digits.css).
 */
const DIGITS_FONT_FAMILY = "banglaDigits"

/** One `@font-face` rule of the page, its `url()`s made absolute. */
type FontFaceRule = {
  readonly family: string
  readonly weight: string
  readonly unicodeRange: string
  /** The `src` descriptor with every `url()` absolute. */
  readonly src: string
  readonly urls: readonly string[]
}

/** The page's `@font-face` rules for `family`. */
function fontFaceRules(page: Page, family: string): Promise<FontFaceRule[]> {
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
async function fontFaceUrls(page: Page, family: string): Promise<string[]> {
  return (await fontFaceRules(page, family)).flatMap((rule) => rule.urls)
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
/** Bangla digits; ১ is the one Hind Siliguri draws as a hook. */
const DIGITS = "১১১১১১"
/** Latin letters (sample text, not a UI label). */
const LATIN = "Hamburgefonstiv"
/** The body font's `font-family` in next/font's `@font-face` rules. */
const BODY_FONT_FAMILY = "Hind Siliguri"
/**
 * The digits face's name inside the font files (packages/ui/src/styles/
 * bangla-digits/make-digits.py); Chrome reports it with the weight's style
 * name after it ("Bangla Digits Medium").
 */
const DIGITS_FACE_NAME = "Bangla Digits"
/** The weights the digits face and the body font load. */
const DIGIT_WEIGHTS = ["400", "500", "600"]
/** Sample text with digits as the site shows them (not UI labels). */
const WIDTH_SAMPLES = [
  "১১ নভেম্বর, ২০২৬",
  "১৪/১৪০",
  "১১টির ০টি শেষ",
  "০১২৩৪৫৬৭৮৯",
]

/**
 * Blocks every file of `family`'s `@font-face` rules for `page`, then opens
 * the home page there. The files are read from a separate first visit.
 */
async function openWithoutFont(
  page: Page,
  browser: Browser,
  browserProblems: BrowserProblems,
  family: string
): Promise<void> {
  const probe = await browser.newContext()
  const probePage = await probe.newPage()
  await probePage.goto("/")
  const blocked = new Set(await fontFaceUrls(probePage, family))
  await probe.close()
  expect(blocked.size, `@font-face files for ${family}`).toBeGreaterThan(0)

  browserProblems.allow(/ERR_BLOCKED_BY_CLIENT/)
  await page.route("**/*.woff2", (route) =>
    blocked.has(route.request().url())
      ? route.abort("blockedbyclient")
      : route.fallback()
  )
  await page.goto("/")
  await page.evaluate(() => document.fonts.ready)
}

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
      await openWithoutFont(page, browser, browserProblems, CODE_FONT_FAMILY)
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

  // Bangla digits come from their own face
  // (packages/ui/src/styles/bangla-digits/README.md); everything else stays in the
  // faces after it in each stack.
  test("Bangla digits take the digits face in the text and code stacks", async ({
    page,
  }) => {
    await page.goto("/")
    const quoted = (name: string) => `["']?${name}["']?`
    // Text stacks start with the digits face; the monospace stack has it
    // right after the code font, which has no Bangla digits.
    const expectedStart = {
      "font-sans": `^${quoted(DIGITS_FONT_FAMILY)},`,
      "font-heading": `^${quoted(DIGITS_FONT_FAMILY)},`,
      "font-mono": `^${quoted(CODE_FONT_FAMILY)}, ?${quoted(DIGITS_FONT_FAMILY)},`,
    }
    for (const [className, start] of Object.entries(expectedStart)) {
      const family = await page.evaluate((name) => {
        const span = document.createElement("span")
        span.className = name
        document.body.append(span)
        const value = getComputedStyle(span).fontFamily
        span.remove()
        return value
      }, className)
      expect(family, className).toMatch(new RegExp(start))
    }
    // One face per weight in use, digits only, each a file of its own that
    // the page does not preload, so it does not queue in front of the body
    // font's files.
    const faces = await page.evaluate(async (wanted) => {
      const found = Array.from(document.fonts).filter(
        (face) => face.family.replace(/^["']|["']$/g, "") === wanted
      )
      await Promise.all(found.map((face) => face.load()))
      return found.map((face) => ({
        weight: face.weight,
        range: face.unicodeRange.toUpperCase(),
        status: face.status,
      }))
    }, DIGITS_FONT_FAMILY)
    expect(faces.map((face) => face.weight).sort()).toEqual(
      [...DIGIT_WEIGHTS].sort()
    )
    for (const face of faces) {
      expect(face.range, face.weight).toBe("U+9E6-9EF")
      expect(face.status, face.weight).toBe("loaded")
    }
    const sources = await fontFaceUrls(page, DIGITS_FONT_FAMILY)
    expect(sources).toHaveLength(faces.length)
    const preloaded = await preloadedFontUrls(page)
    for (const source of sources) {
      expect(source).toMatch(/\.woff2$/)
      expect(preloaded, source).not.toContain(source)
    }
  })

  test("Bangla digits render in the digits face, nothing else does", async ({
    page,
  }) => {
    await page.goto("/")
    // `font-display: swap`: once a weight has loaded, digits render in it.
    await page.evaluate(
      async ({ family, digit, weights }) => {
        await Promise.all(
          weights.map((weight) =>
            document.fonts.load(`${weight} 16px ${family}`, digit)
          )
        )
        await document.fonts.ready
      },
      {
        family: DIGITS_FONT_FAMILY,
        digit: DIGITS.charAt(0),
        weights: DIGIT_WEIGHTS,
      }
    )
    const renderedFamilies = await openFontProbe(page)
    try {
      for (const weight of DIGIT_WEIGHTS) {
        const isDigitsFace = (family: string) =>
          family.startsWith(DIGITS_FACE_NAME)
        const forDigits = await renderedFamilies(DIGITS, weight)
        expect(forDigits.length, `digits at ${weight}`).toBeGreaterThan(0)
        expect(forDigits.every(isDigitsFace), `digits at ${weight}`).toBe(true)
        for (const text of [LATIN, BANGLA]) {
          const families = await renderedFamilies(text, weight)
          expect(families.some(isDigitsFace), `${text} at ${weight}`).toBe(
            false
          )
        }
      }
    } finally {
      await renderedFamilies.close()
    }
  })

  // The digits face has Hind Siliguri's advance widths and line metrics, so
  // swapping it in over Hind's digits changes glyph shapes only: no re-wrap,
  // no layout shift. (Over the system fallback, when Hind itself missed the
  // first paint, widths can change: ADR-0017, Consequences.)
  // Compared on copies of both faces loaded by the test, so whether the page's
  // own `optional` body font made the first paint does not matter.
  test("Bangla digits are exactly as wide and tall as the body font's", async ({
    page,
  }) => {
    await page.goto("/")
    const results = await page.evaluate(
      async ({ bodyRules, digitRules, samples, weights }) => {
        // Test-only copies of every face of a family, loaded now.
        const copy = async (rules: readonly FontFaceRule[], as: string) => {
          const faces = rules.map((rule) => {
            const face = new FontFace(as, rule.src, {
              weight: rule.weight,
              unicodeRange: rule.unicodeRange,
            })
            document.fonts.add(face)
            return face
          })
          await Promise.all(faces.map((face) => face.load()))
          return faces.length
        }
        const bodyFaces = await copy(bodyRules, "TestBody")
        const digitFaces = await copy(digitRules, "TestDigits")
        const measure = (
          text: string,
          family: string,
          weight: string,
          lineHeight: string
        ) => {
          const element = document.createElement("div")
          element.style.cssText = `position:absolute;white-space:nowrap;font-size:40px;width:max-content`
          element.style.fontFamily = family
          element.style.fontWeight = weight
          element.style.lineHeight = lineHeight
          element.textContent = text
          document.body.append(element)
          const { width, height } = element.getBoundingClientRect()
          element.remove()
          return { width, height }
        }
        const rows = []
        for (const weight of weights) {
          for (const text of samples) {
            for (const lineHeight of ["normal", "1.85"]) {
              const alone = measure(text, "TestBody", weight, lineHeight)
              const withDigits = measure(
                text,
                "TestDigits, TestBody",
                weight,
                lineHeight
              )
              rows.push({ weight, text, lineHeight, alone, withDigits })
            }
          }
        }
        return { bodyFaces, digitFaces, rows }
      },
      {
        bodyRules: await fontFaceRules(page, BODY_FONT_FAMILY),
        digitRules: await fontFaceRules(page, DIGITS_FONT_FAMILY),
        samples: WIDTH_SAMPLES,
        weights: DIGIT_WEIGHTS,
      }
    )
    expect(results.bodyFaces, "body font faces").toBeGreaterThan(0)
    expect(results.digitFaces, "digits faces").toBe(DIGIT_WEIGHTS.length)
    for (const {
      weight,
      text,
      lineHeight,
      alone,
      withDigits,
    } of results.rows) {
      const label = `"${text}" at ${weight}, line-height ${lineHeight}`
      expect(
        Math.abs(withDigits.width - alone.width),
        `${label}: width`
      ).toBeLessThan(0.5)
      expect(withDigits.height, `${label}: height`).toBe(alone.height)
    }
  })
})

/**
 * Opens one DevTools protocol session on `page` and returns a function that
 * tells the font families Chrome used to draw `text` in a `font-sans` span
 * at `weight`, deduplicated. Call `close()` when done.
 */
async function openFontProbe(page: Page): Promise<{
  (text: string, weight: string): Promise<string[]>
  close: () => Promise<void>
}> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("DOM.enable")
  await cdp.send("CSS.enable")
  const { root } = await cdp.send("DOM.getDocument")
  const probe = async (text: string, weight: string) => {
    await page.evaluate(
      ([content, fontWeight]) => {
        const span = document.createElement("span")
        span.id = "font-probe"
        span.className = "font-sans"
        span.style.fontWeight = fontWeight
        span.textContent = content
        document.body.append(span)
      },
      [text, weight] as const
    )
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "#font-probe",
    })
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId })
    await page.evaluate(() => document.getElementById("font-probe")?.remove())
    return [...new Set(fonts.map((font) => font.familyName))]
  }
  return Object.assign(probe, { close: () => cdp.detach() })
}
