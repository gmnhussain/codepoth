import { AxeBuilder } from "@axe-core/playwright"

import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { LAYOUT_SHIFT_ANNOTATION } from "./support/layout-shift-reporter"
import {
  builtPageRoutes,
  isLessonRoute,
  isReaderRoute,
  isTopicRoute,
  representativeRoutes,
} from "./support/routes"
import { expect, test } from "./support/test"

/** Widths every route is checked at: the smallest phone, tablet, desktop. */
const WIDTHS = [320, 768, 1280] as const
const THEMES = ["light", "dark"] as const
const VIEWPORT_HEIGHT = 800

/** A path no route matches, so the sweep covers the not-found page too. */
const MISSING_PATH = "/no-such-page"
const NOT_FOUND_STATUS = 404

/** next-themes' default storage key, which the site keeps. */
const THEME_STORAGE_KEY = "theme"

/** axe-core rule tags for WCAG 2.2 AA (conventions §11). */
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

/** How many offending elements a failure lists per rule. */
const NODES_SHOWN = 3

/**
 * `E2E_MATRIX=reduced` (CI) checks every route once, at the narrowest width
 * in light, and every other combination only on the pages that are neither
 * topics nor lessons plus representative ones (the largest topic, the
 * largest lesson, a lesson with a table). The full matrix (the default) is
 * run locally before a branch is merged (conventions §14).
 */
const isReduced = process.env.E2E_MATRIX === "reduced"

const routes = [...builtPageRoutes().filter(isReaderRoute), MISSING_PATH]
const sampleRoutes = new Set([
  ...routes.filter((route) => !isTopicRoute(route) && !isLessonRoute(route)),
  ...representativeRoutes(routes),
])

function routesFor(width: number, theme: (typeof THEMES)[number]) {
  if (!isReduced || (width === WIDTHS[0] && theme === THEMES[0])) return routes
  return routes.filter((route) => sampleRoutes.has(route))
}

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test.describe(`${String(width)}px ${theme}`, { tag: "@both" }, () => {
      test.use({
        viewport: { width, height: VIEWPORT_HEIGHT },
        colorScheme: theme,
      })

      for (const route of routesFor(width, theme)) {
        test(route, async ({ page, browserProblems }, testInfo) => {
          const isMissing = route === MISSING_PATH
          // The browser logs the document's own 404 as a console error.
          if (isMissing) browserProblems.allow(/status of 404/)
          await page.addInitScript(
            ([key, value]) => {
              localStorage.setItem(key, value)
            },
            [THEME_STORAGE_KEY, theme] as const
          )
          await observeLayoutShifts(page)

          const response = await page.goto(route)
          expect(response?.status()).toBe(isMissing ? NOT_FOUND_STATUS : 200)
          // Load, hydration, the idle prefetch and link prefetches settle.
          await page.waitForLoadState("networkidle")
          expect(
            await page.evaluate(() =>
              document.documentElement.classList.contains("dark")
            )
          ).toBe(theme === "dark")

          // Read before the accessibility scan, whose work on the page is
          // not the reader's.
          const shift = await layoutShiftTotal(page)
          testInfo.annotations.push({
            type: LAYOUT_SHIFT_ANNOTATION,
            description: `${route} ${String(shift)}`,
          })
          await testInfo.attach("layout-shift", { body: String(shift) })
          expect.soft(shift, "layout shift").toBeLessThan(LAYOUT_SHIFT_LIMIT)

          const overflow = await page.evaluate(() => {
            const root = document.documentElement
            const widest = [...document.body.querySelectorAll("*")]
              .filter(
                (element) =>
                  element.getBoundingClientRect().right > root.clientWidth
              )
              .slice(0, 3)
              .map((element) => element.outerHTML.slice(0, 120))
            return {
              scrollWidth: root.scrollWidth,
              clientWidth: root.clientWidth,
              widest,
            }
          })
          expect
            .soft(
              overflow.scrollWidth,
              `sideways scroll; past the edge: ${overflow.widest.join(" | ")}`
            )
            .toBeLessThanOrEqual(overflow.clientWidth)

          const axe = await new AxeBuilder({ page })
            .withTags(AXE_TAGS)
            .analyze()
          expect
            .soft(
              axe.violations.map(
                (violation) =>
                  `${violation.id} (${violation.impact ?? "?"}): ${violation.nodes
                    .slice(0, NODES_SHOWN)
                    .map((node) => node.target.join(" "))
                    .join(" | ")}`
              ),
              "accessibility violations"
            )
            .toEqual([])
        })
      }
    })
  }
}
