import type { Page } from "@playwright/test"

import { ROADMAP_STATE_LABEL } from "@/components/roadmap/state-label"
import { markDone, recordOpen } from "@/lib/progress/operations"

import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { lessonIndex, lessonsOf, topicUrlOf } from "./support/lessons"
import type { BuiltLesson } from "./support/lessons"
import { EMPTY_PROGRESS, seedProgress } from "./support/progress"
import { expect, test } from "./support/test"

/** A topic's roadmap key from its URL, /learn/[track]/[topic] (ADR-0006). */
function topicKeyOf(lesson: BuiltLesson): string {
  return topicUrlOf(lesson).split("/").slice(2).join("/")
}

/** The topic buttons on the map. */
function mapOf(page: Page) {
  return page.getByRole("group", { name: t("roadmap.mapLabel") })
}

test.describe("roadmap", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  test("a topic opens its panel, in the URL, and Escape closes it", async ({
    page,
  }) => {
    await page.goto("/roadmap")
    const dot = mapOf(page).getByRole("button").first()
    const key = await dot.getAttribute("data-topic")
    if (key === null) throw new Error("topic button without data-topic")

    await dot.focus()
    await page.keyboard.press("Enter")
    await expect(dot).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(
      new RegExp(`[?&]topic=${encodeURIComponent(key)}`)
    )
    const close = page.getByRole("button", { name: t("roadmap.closePanel") })
    await expect(close).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(close).toHaveCount(0)
    await expect(page).not.toHaveURL(/topic=/)
    await expect(dot).toBeFocused()
  })

  test("track and start filters live in the URL and reset", async ({
    page,
  }) => {
    await page.goto("/roadmap")
    // The legend column from md, a chip row below it: the visible one.
    const tracks = page
      .getByLabel(t("roadmap.pickTrack"), { exact: true })
      .filter({ visible: true })
      .first()
    const track = tracks.getByRole("button").nth(1)
    await track.click()
    await expect(track).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(/[?&]track=/)

    const filter = page
      .getByRole("group", { name: t("roadmap.filterLabel") })
      .getByRole("button", { name: t("roadmap.filterStart"), exact: true })
    await filter.click()
    await expect(filter).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(/[?&]filter=/)

    await page.goto("/roadmap")
    await expect(page).not.toHaveURL(/[?&](track|filter)=/)
  })

  test("dots name each topic's state from saved progress", async ({
    page,
    request,
  }) => {
    const lessons = lessonsOf(await lessonIndex(request))
    const [first] = lessons
    if (first === undefined) throw new Error("the build has no lessons")
    const doneTopic = lessons.filter(
      (lesson) => topicUrlOf(lesson) === topicUrlOf(first)
    )
    const other = lessons.find(
      (lesson) => topicUrlOf(lesson) !== topicUrlOf(first)
    )
    if (other === undefined) throw new Error("the build has one topic only")
    const now = new Date()
    await seedProgress(
      page,
      recordOpen(
        doneTopic.reduce(
          (value, lesson) => markDone(value, lesson.id, now),
          EMPTY_PROGRESS
        ),
        other.id,
        now
      )
    )
    await page.goto("/roadmap")

    const dotOf = (lesson: BuiltLesson) =>
      mapOf(page).locator(`[data-topic="${topicKeyOf(lesson)}"]`)
    await expect(dotOf(first)).toHaveAccessibleName(
      new RegExp(t(ROADMAP_STATE_LABEL.done))
    )
    await expect(dotOf(other)).toHaveAccessibleName(
      new RegExp(t(ROADMAP_STATE_LABEL["in-progress"]))
    )
  })
})
