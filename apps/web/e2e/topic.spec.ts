import { markDone, recordOpen } from "@/lib/progress/operations"
import { continueLesson } from "@/lib/progress/selectors"

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

/** A topic with groups, chosen from the build: the first with two of them. */
type GroupedTopic = {
  readonly url: string
  readonly lessons: readonly BuiltLesson[]
  readonly groups: readonly (readonly BuiltLesson[])[]
}

let topic: GroupedTopic

/** Items grouped by a key, in first-seen order. */
function groupBy<T>(
  items: readonly T[],
  keyOf: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return groups
}

test.beforeAll(async ({ request }) => {
  const index = await lessonIndex(request)
  const byTopic = groupBy(lessonsOf(index), topicUrlOf)
  for (const [url, topicLessons] of byTopic) {
    const grouped = topicLessons.filter(
      (lesson) => index.scopes[lesson.scope]?.isGroup === true
    )
    const groups = [
      ...groupBy(grouped, (lesson) => lesson.scope).values(),
    ].filter((group) => group.length > 1)
    if (groups.length > 1) {
      topic = { url, lessons: topicLessons, groups }
      return
    }
  }
  throw new Error("the build has no topic with two groups of lessons")
})

test.describe("topic progress", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  test("a first visit offers the topic's first lesson", async ({ page }) => {
    await page.goto(topic.url)
    await page.waitForLoadState("networkidle")
    await expect(
      page.getByRole("heading", { name: t("topic.startHeading") })
    ).toBeVisible()
    await expect(
      page
        .getByText(t("topic.continueHere"), { exact: true })
        .filter({ visible: true })
    ).toHaveCount(0)
  })

  test("progress shows counts, group states and lesson marks", async ({
    page,
  }) => {
    const [finished, current] = topic.groups
    if (finished === undefined || current === undefined) return
    const [reading] = current
    if (reading === undefined) return
    const now = new Date()
    const progress = recordOpen(
      finished.reduce(
        (value, lesson) => markDone(value, lesson.id, now),
        EMPTY_PROGRESS
      ),
      reading.id,
      now
    )
    await seedProgress(page, progress)
    await page.goto(topic.url)

    await expect(
      page
        .getByText(
          t("topic.progress", {
            total: topic.lessons.length,
            done: finished.length,
          })
        )
        .first()
    ).toBeVisible()
    await expect(page.getByText(t("topic.groupDone")).first()).toBeVisible()
    await expect(page.getByText(t("topic.readingNow")).first()).toBeVisible()

    // Each lesson row's link is named with its state (lesson-row-status.tsx).
    const rowOf = (lesson: BuiltLesson) =>
      page.locator(`a[href="${lesson.url}"]`).filter({ hasText: lesson.title })
    for (const lesson of finished) {
      await expect(rowOf(lesson).first()).toHaveAccessibleName(
        new RegExp(t("status.done"))
      )
    }
    const nextId = continueLesson(
      progress,
      topic.lessons.map((lesson) => lesson.id)
    )
    const next = topic.lessons.find((lesson) => lesson.id === nextId)
    if (next === undefined) throw new Error("no lesson to continue with")
    await expect(rowOf(next).first()).toHaveAccessibleName(
      new RegExp(t("topic.continueHere"))
    )
  })
})
