import { formatNumber } from "@workspace/config/format"

import { markDone } from "@/lib/progress/operations"

import {
  BODY_FONT_FAMILY,
  DIGITS_FONT_FAMILY,
  openWithoutFont,
} from "./support/fonts"
import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { lessonIndex, lessonsOf } from "./support/lessons"
import { EMPTY_PROGRESS, seedProgress } from "./support/progress"
import { expect, test } from "./support/test"

/** Lessons marked done for the status filter. */
const DONE_COUNT = 2

/** An English word of at least three letters in a title. */
const ENGLISH_WORD = /[A-Za-z]{3,}/

/** The lesson rows the island shows or hides (contents-controls.tsx). */
const LESSON_ROW = "[data-lesson-search]"

/** The narrowest supported viewport (routes.spec.ts sweeps it too). */
const NARROW_VIEWPORT = { width: 320, height: 800 }

/** The weight the stats' digits use (`font-semibold`). */
const STATS_WEIGHT = "600"

// Outside the describe below: a load with ?q= shifts by design, a known
// shift (performance.md "Known layout shift"). Recorded, not asserted.
test("a shared ?q= link applies the search on load", async ({
  page,
  request,
}, testInfo) => {
  const [lesson] = lessonsOf(await lessonIndex(request))
  if (lesson === undefined) throw new Error("the build has no lessons")
  await observeLayoutShifts(page)
  await page.goto(`/contents?q=${encodeURIComponent(lesson.title)}`)

  await expect(
    page.getByRole("searchbox", { name: t("contents.searchLabel") })
  ).toHaveValue(lesson.title)
  await expect(
    page.locator(`${LESSON_ROW}[data-lesson-id="${lesson.id}"]`)
  ).toBeVisible()
  testInfo.annotations.push({
    type: "known layout shift",
    description: String(await layoutShiftTotal(page)),
  })
})

test.describe("contents", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  // A reader whose body font misses the first paint sees the stats in the
  // wider system fallback until the digits face swaps in. The layout shift
  // is asserted in afterEach, once the swap has settled.
  test("the digits swapping in over the fallback font shift nothing", async ({
    page,
    browser,
    browserProblems,
  }) => {
    await page.setViewportSize(NARROW_VIEWPORT)
    await openWithoutFont(
      page,
      browser,
      browserProblems,
      BODY_FONT_FAMILY,
      "/contents"
    )
    await page.waitForFunction(
      ({ family, weight }) =>
        Array.from(document.fonts).some(
          (face) =>
            face.family.replace(/^["']|["']$/g, "") === family &&
            face.weight === weight &&
            face.status === "loaded"
        ),
      { family: DIGITS_FONT_FAMILY, weight: STATS_WEIGHT }
    )
    await page.waitForLoadState("networkidle")
  })

  test("the status filter shows only done lessons and back", async ({
    page,
    request,
  }) => {
    const done = lessonsOf(await lessonIndex(request)).slice(0, DONE_COUNT)
    const now = new Date()
    await seedProgress(
      page,
      done.reduce(
        (value, lesson) => markDone(value, lesson.id, now),
        EMPTY_PROGRESS
      )
    )
    await page.goto("/contents")
    const filters = page.getByRole("group", { name: t("contents.filterLabel") })
    const doneFilter = filters.getByRole("button", {
      name: new RegExp(`^${t("contents.filterDone")}`),
    })
    const allFilter = filters.getByRole("button", {
      name: new RegExp(`^${t("contents.filterAll")}`),
    })

    // Click once the saved progress is shown, as a reader would: it loads
    // just after hydration (ADR-0014).
    await expect(doneFilter).toHaveAccessibleName(
      new RegExp(`^${t("contents.filterDone")}\\s*${formatNumber(DONE_COUNT)}$`)
    )
    await doneFilter.click()
    await expect(doneFilter).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(/[?&]status=done/)
    await expect(
      page.getByRole("status").filter({
        hasText: t("contents.matched", { n: DONE_COUNT }),
      })
    ).toBeVisible()
    const shown = page.locator(`${LESSON_ROW}:visible`)
    await expect(shown).toHaveCount(DONE_COUNT)
    expect(
      (
        await shown.evaluateAll((rows) =>
          rows.map((row) => (row as HTMLElement).dataset.lessonId)
        )
      ).sort()
    ).toEqual(done.map((lesson) => lesson.id).sort())

    await allFilter.click()
    await expect(allFilter).toHaveAttribute("aria-pressed", "true")
    await expect(page).not.toHaveURL(/status=/)
    await expect(page.locator(`${LESSON_ROW}[hidden]`)).toHaveCount(0)
  })

  test("search narrows to a lesson, lives in ?q= and clears", async ({
    page,
    request,
  }) => {
    // Typed with key presses, as a reader types, so the filter's shift
    // counts as caused by input. Playwright presses only US-layout keys, so
    // the query is the first English word of a lesson title.
    const lesson = lessonsOf(await lessonIndex(request)).find((item) =>
      ENGLISH_WORD.test(item.title)
    )
    const word = lesson?.title.match(ENGLISH_WORD)?.[0]
    if (lesson === undefined || word === undefined) {
      throw new Error("no lesson title has an English word")
    }
    await page.goto("/contents")
    const field = page.getByRole("searchbox", {
      name: t("contents.searchLabel"),
    })
    await field.pressSequentially(word)
    await expect(page).toHaveURL(/[?&]q=/)
    await expect(
      page.locator(`${LESSON_ROW}[data-lesson-id="${lesson.id}"]`)
    ).toBeVisible()

    await field.press("ControlOrMeta+A")
    await field.press("Backspace")
    await expect(page).not.toHaveURL(/q=/)
    await expect(page.locator(`${LESSON_ROW}[hidden]`)).toHaveCount(0)
  })

  test("a jump link opens its closed track", async ({ page }) => {
    await page.goto("/contents")
    const jumps = page
      .getByRole("navigation", { name: t("contents.jumpTo") })
      .getByRole("link")
    // The first track starts open; the last one starts closed.
    const jump = jumps.last()
    const href = await jump.getAttribute("href")
    if (href === null) throw new Error("jump link without href")
    const id = href.slice(1)
    const details = page.locator(`details:has([id="${id}"])`)
    await expect(details).not.toHaveAttribute("open")

    await jump.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    await expect(details).toHaveAttribute("open")
    await expect(details.locator("summary")).toBeInViewport()
  })

  test("open all and close all", async ({ page }) => {
    await page.goto("/contents")
    const tracks = page.locator("section[data-filter-track] > details")
    const expand = page.getByRole("group", { name: t("contents.expandLabel") })

    await expand.getByRole("button", { name: t("contents.openAll") }).click()
    await expect(tracks.and(page.locator(":not([open])"))).toHaveCount(0)

    await expand.getByRole("button", { name: t("contents.closeAll") }).click()
    await expect(tracks.and(page.locator("[open]"))).toHaveCount(0)
  })
})
