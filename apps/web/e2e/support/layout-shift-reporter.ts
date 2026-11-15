import type { Reporter, TestCase } from "@playwright/test/reporter"

/** The annotation a test adds with the layout shift it measured. */
export const LAYOUT_SHIFT_ANNOTATION = "layout-shift"

/** How many of the worst routes the summary lists. */
const WORST_SHOWN = 5

/**
 * Prints one summary line after a run: the largest layout shift any test
 * measured, and the routes with the largest shifts (each route's maximum
 * over its widths and themes). Tests report through an annotation whose
 * description is `<route> <value>`.
 */
export default class LayoutShiftReporter implements Reporter {
  private readonly maxByRoute = new Map<string, number>()

  onTestEnd(test: TestCase): void {
    for (const annotation of test.annotations) {
      if (annotation.type !== LAYOUT_SHIFT_ANNOTATION) continue
      const [route, value] = (annotation.description ?? "").split(" ")
      const shift = Number(value)
      if (route === undefined || Number.isNaN(shift)) continue
      this.maxByRoute.set(
        route,
        Math.max(shift, this.maxByRoute.get(route) ?? 0)
      )
    }
  }

  onEnd(): void {
    if (this.maxByRoute.size === 0) return
    const worst = [...this.maxByRoute]
      .sort(([, a], [, b]) => b - a)
      .slice(0, WORST_SHOWN)
    const shifted = [...this.maxByRoute.values()].filter((v) => v > 0).length
    process.stdout.write(
      `\nlayout shift: ${String(this.maxByRoute.size)} routes, ${String(shifted)} above 0; largest: ${worst
        .map(([route, value]) => `${route} ${value.toFixed(4)}`)
        .join(", ")}\n`
    )
  }

  printsToStdio(): boolean {
    return false
  }
}
