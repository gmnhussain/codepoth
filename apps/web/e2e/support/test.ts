import { test as base, expect } from "@playwright/test"

/** Lets a test accept a browser message it causes on purpose. */
export type BrowserProblems = {
  /** Accept every reported problem that matches the pattern. */
  readonly allow: (pattern: RegExp) => void
}

/** A request the browser cancelled itself (a navigation, a closed page). */
const ABORTED = "net::ERR_ABORTED"

/**
 * Playwright's `test` with one automatic fixture: a test fails on any
 * console error or warning, uncaught page error or failed request to the
 * site, on every page of its browser context (conventions §14). Production
 * React reports a hydration mismatch as a console error, so this catches
 * those too.
 */
export const test = base.extend<{ browserProblems: BrowserProblems }>({
  browserProblems: [
    async ({ context, baseURL }, provide) => {
      const problems: string[] = []
      const allowed: RegExp[] = []
      context.on("console", (message) => {
        const type = message.type()
        if (type !== "error" && type !== "warning") return
        const { url } = message.location()
        problems.push(`console.${type}: ${message.text()} (${url})`)
      })
      context.on("weberror", (webError) => {
        problems.push(`page error: ${webError.error().message}`)
      })
      context.on("requestfailed", (request) => {
        const failure = request.failure()?.errorText ?? "unknown"
        const isSite =
          baseURL !== undefined && request.url().startsWith(baseURL)
        if (isSite && failure !== ABORTED) {
          problems.push(`request failed: ${request.url()} (${failure})`)
        }
      })

      await provide({
        allow: (pattern) => {
          allowed.push(pattern)
        },
      })

      const unexpected = problems.filter(
        (problem) => !allowed.some((pattern) => pattern.test(problem))
      )
      expect(
        unexpected,
        "console errors, page errors or failed requests"
      ).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
