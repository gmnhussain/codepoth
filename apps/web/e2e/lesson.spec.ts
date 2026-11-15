import type { Page } from "@playwright/test"

import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { lessonIndex, lessonsOf } from "./support/lessons"
import type { BuiltLesson } from "./support/lessons"
import { storedProgress } from "./support/progress"
import { builtHtmlOf } from "./support/routes"
import { expect, test } from "./support/test"

/** The section a reading test scrolls to: far enough to leave the first. */
const TARGET_SECTION = 3

/** Wheel steps until a heading reaches the top of the viewport. */
const MAX_WHEEL_STEPS = 60
const WHEEL_STEP_PX = 300
/** Where a section counts as reached: below the sticky header. */
const READ_LINE_PX = 200

let lesson: BuiltLesson

/** In-page links in a built page: its sections, plus the skip link. */
function inPageLinkCount(url: string): number {
  return new Set(builtHtmlOf(url).match(/href="#[^"]+"/g)).size
}

// The lesson with the most sections in the build, so there is room to
// scroll past several; chosen from the build, never by name.
test.beforeAll(async ({ request }) => {
  const lessons = lessonsOf(await lessonIndex(request))
  const [most] = lessons
    .map((item) => ({ item, count: inPageLinkCount(item.url) }))
    .sort((a, b) => b.count - a.count)
  if (most === undefined) throw new Error("the build has no lessons")
  lesson = most.item
})

/** The ids of the lesson's sections, in order, from its "এই পাঠে" list. */
async function sectionIds(page: Page): Promise<string[]> {
  const hrefs = await page
    .getByRole("navigation", { name: t("lesson.inThisLesson") })
    .filter({ visible: true })
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? "")
    )
  return hrefs
    .filter((href) => href.startsWith("#"))
    .map((href) => decodeURIComponent(href.slice(1)))
}

/** Scrolls with the mouse wheel (trusted input) until a section is reached. */
async function wheelTo(page: Page, id: string): Promise<void> {
  const target = page.locator(`[id="${id}"]`)
  for (let step = 0; step < MAX_WHEEL_STEPS; step++) {
    const box = await target.boundingBox()
    if (box !== null && box.y < READ_LINE_PX) return
    await page.mouse.wheel(0, WHEEL_STEP_PX)
  }
  throw new Error(`could not scroll to #${id}`)
}

test.describe("reading a lesson", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  test("opening a lesson records it as opened and last read", async ({
    page,
  }) => {
    await page.goto(lesson.url)
    await expect
      .poll(async () => {
        const progress = await storedProgress(page)
        return {
          isOpened: progress.lessons[lesson.id]?.openedAt !== undefined,
          lastRead: progress.lastRead?.id,
        }
      })
      .toEqual({ isOpened: true, lastRead: lesson.id })
  })

  test("mark done toggles in place with a fixed label", async ({ page }) => {
    await page.goto(lesson.url)
    const button = page.getByRole("button", {
      name: t("lesson.markDone"),
      exact: true,
    })
    await expect(button).toHaveAttribute("aria-pressed", "false")

    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "true")
    await expect(button).toHaveText(t("lesson.markDone"))
    await expect
      .poll(async () => (await storedProgress(page)).lessons[lesson.id]?.doneAt)
      .toBeDefined()

    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "false")
    await expect
      .poll(async () => {
        const entry = (await storedProgress(page)).lessons[lesson.id]
        return { isOpened: entry !== undefined, doneAt: entry?.doneAt }
      })
      .toEqual({ isOpened: true, doneAt: undefined })
  })

  test("bookmark toggles in place and is kept", async ({ page }) => {
    await page.goto(lesson.url)
    const button = page.getByRole("button", {
      name: t("lesson.bookmark"),
      exact: true,
    })
    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "true")
    await expect(button).toHaveText(t("lesson.bookmark"))

    await page.reload()
    await expect(button).toHaveAttribute("aria-pressed", "true")
    expect(
      Object.hasOwn((await storedProgress(page)).bookmarks, lesson.id)
    ).toBe(true)

    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "false")
  })

  test("the section read to is saved and Home resumes there", async ({
    page,
  }) => {
    await page.goto(lesson.url)
    const ids = await sectionIds(page)
    const target = ids[TARGET_SECTION - 1]
    if (target === undefined) {
      throw new Error(
        `${lesson.url} has fewer than ${String(TARGET_SECTION)} sections`
      )
    }

    await wheelTo(page, target)
    await expect
      .poll(async () => (await storedProgress(page)).lastRead?.anchor, {
        timeout: 10_000,
      })
      .toBe(target)

    await page.goto("/")
    const resume = page.getByRole("link", {
      name: t("home.continue"),
      exact: true,
    })
    await expect(resume).toHaveAttribute(
      "href",
      `${lesson.url}#${encodeURIComponent(target)}`
    )
    await expect(
      page.getByText(t("home.resumeLine", { lesson: lesson.title }), {
        exact: false,
      })
    ).toBeVisible()
  })
})
