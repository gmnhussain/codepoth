import type { Page } from "@playwright/test"

/**
 * The most layout shift a page may add during a test: a tenth of the "good"
 * CLS limit (0.1, performance.md). Exactly 0 would be flaky over hundreds of
 * loads: the Dashboard measures 0.0001–0.0005 without any visible shift.
 */
export const LAYOUT_SHIFT_LIMIT = 0.01

/** The global the observer adds its total to. */
const TOTAL_KEY = "__codepothLayoutShift"

/** A `layout-shift` entry; TypeScript's DOM types do not have it. */
type LayoutShiftEntry = PerformanceEntry & {
  readonly value: number
  readonly hadRecentInput: boolean
}

type ShiftWindow = Window & { [TOTAL_KEY]?: number }

/**
 * Starts adding up layout shifts not caused by input, on every document the
 * page loads from now on (buffered, so shifts before the observer count).
 * The total is an upper bound of CLS, which takes only the worst window.
 */
export async function observeLayoutShifts(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    const target = window as ShiftWindow
    target[key as typeof TOTAL_KEY] = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (entry.hadRecentInput) continue
        target[key as typeof TOTAL_KEY] =
          (target[key as typeof TOTAL_KEY] ?? 0) + entry.value
      }
    }).observe({ type: "layout-shift", buffered: true })
  }, TOTAL_KEY)
}

/** The layout shift the current document has added up so far. */
export async function layoutShiftTotal(page: Page): Promise<number> {
  return page.evaluate(
    (key) => (window as ShiftWindow)[key as typeof TOTAL_KEY] ?? 0,
    TOTAL_KEY
  )
}
