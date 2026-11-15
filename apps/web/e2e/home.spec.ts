import { markDone, recordOpen } from "@/lib/progress/operations"

import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { lessonIndex, lessonsOf } from "./support/lessons"
import { EMPTY_PROGRESS, seedProgress } from "./support/progress"
import { expect, test } from "./support/test"

test.describe("home", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  test("a first visit offers the start, not a resume", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await expect(
      page.getByRole("link", { name: t("home.start"), exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: t("home.continue"), exact: true })
    ).toHaveCount(0)
  })

  test("a returning reader gets the last-read lesson with its scope", async ({
    page,
    request,
  }) => {
    const index = await lessonIndex(request)
    // The first lesson of a scope with several lessons, the first of them done.
    const lessons = lessonsOf(index)
    const scopeLessons = Object.values(index.scopes).find(
      (scope) => scope.lessonIds.length > 1
    )
    const [doneId, readId] = scopeLessons?.lessonIds ?? []
    const read = lessons.find((lesson) => lesson.id === readId)
    if (scopeLessons === undefined || doneId === undefined || !read) {
      throw new Error("the build has no scope with two lessons")
    }
    const now = new Date()
    await seedProgress(
      page,
      recordOpen(markDone(EMPTY_PROGRESS, doneId, now), read.id, now)
    )

    await page.goto("/")
    const resume = page.getByRole("link", {
      name: t("home.continue"),
      exact: true,
    })
    await expect(resume).toHaveAttribute("href", read.url)
    const scopeLine = scopeLessons.isGroup
      ? t("home.resumeGroup", {
          group: scopeLessons.title,
          total: scopeLessons.lessonIds.length,
          done: 1,
        })
      : t("home.resumeTopic", {
          topic: scopeLessons.title,
          total: scopeLessons.lessonIds.length,
          done: 1,
        })
    await expect(
      page.getByText(
        `${t("home.resumeLine", { lesson: read.title })} · ${scopeLine}`
      )
    ).toBeVisible()
  })
})
