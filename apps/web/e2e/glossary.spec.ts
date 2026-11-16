import type { Page } from "@playwright/test"

import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { lessonIndex, lessonsOf } from "./support/lessons"
import { builtHtmlOf } from "./support/routes"
import { expect, test } from "./support/test"

/** The term cards the island shows or hides (glossary-controls.tsx). */
const TERM_CARD = "article[data-term]"

/** A term's popover trigger in a lesson body (the shadcn popover slot). */
const TERM_TRIGGER = 'data-slot="popover-trigger"'

/**
 * Makes requestAnimationFrame never call back, as in a background tab: URL
 * state must apply without it (performance.md, design.md "Contents page").
 * Headless Chromium reports background tabs as visible, so a real one
 * would not show the difference.
 */
async function withoutAnimationFrames(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.requestAnimationFrame = () => 0
  })
}

/** The first letter with terms: its button and letter. */
async function firstLetter(page: Page) {
  const button = page
    .getByRole("navigation", { name: t("glossary.letterNav") })
    .getByRole("button")
    .and(page.locator(":enabled"))
    .nth(1)
  const letter = (await button.innerText()).trim()
  return { button, letter }
}

test.describe("glossary", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  test("a letter shows only its terms, in ?letter=, and toggles off", async ({
    page,
  }) => {
    await page.goto("/glossary")
    const { button, letter } = await firstLetter(page)
    const expected = await page
      .locator(`${TERM_CARD}[data-letter="${letter}"]`)
      .count()

    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(/[?&]letter=/)
    await expect(page.locator(`${TERM_CARD}:visible`)).toHaveCount(expected)
    await expect(
      page.getByRole("status").filter({
        hasText: t("glossary.matched", { n: expected }),
      })
    ).toHaveCount(1)

    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "false")
    await expect(page).not.toHaveURL(/letter=/)
    await expect(page.locator(`${TERM_CARD}[hidden]`)).toHaveCount(0)
  })

  test("search finds a term by its English name", async ({ page }) => {
    await page.goto("/glossary")
    const card = page.locator(TERM_CARD).first()
    const term = (await card.locator("h3").innerText()).trim()
    const field = page.getByRole("searchbox", {
      name: t("glossary.searchLabel"),
    })
    await field.fill(term)
    await expect(page).toHaveURL(/[?&]q=/)
    await expect(card).toBeVisible()
  })

  test("shared ?letter= and ?q= apply without animation frames", async ({
    page,
  }) => {
    await page.goto("/glossary")
    const { letter } = await firstLetter(page)
    const expected = await page
      .locator(`${TERM_CARD}[data-letter="${letter}"]`)
      .count()

    await withoutAnimationFrames(page)
    await page.goto(`/glossary?letter=${encodeURIComponent(letter)}`)
    await expect(page.locator(`${TERM_CARD}:visible`)).toHaveCount(expected)
  })

  test("a #term link outlines its card", async ({ page }) => {
    await page.goto("/glossary")
    const id = await page
      .locator(`${TERM_CARD} h3[id]`)
      .last()
      .getAttribute("id")
    if (id === null) throw new Error("term heading without id")

    await page.goto(`/glossary#${encodeURIComponent(id)}`)
    const target = page.locator(`${TERM_CARD}:has(:target)`)
    await expect(target).toHaveCount(1)
    await expect(target.locator("h3")).toHaveAttribute("id", id)
    await expect(target).toBeInViewport()
  })

  test("a term in a lesson links to its glossary card", async ({
    page,
    request,
  }) => {
    // The first lesson whose body uses a <Term> (term-popover.tsx).
    const lesson = lessonsOf(await lessonIndex(request)).find((item) =>
      builtHtmlOf(item.url).includes(TERM_TRIGGER)
    )
    if (lesson === undefined) throw new Error("no lesson uses a term")

    await page.goto(lesson.url)
    await page.locator(`main [${TERM_TRIGGER}]`).first().click()
    const link = page.getByRole("link", { name: t("term.seeInGlossary") })
    const href = await link.getAttribute("href")
    if (href === null) throw new Error("glossary link without href")

    await link.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    const target = page.locator(`${TERM_CARD}:has(:target)`)
    await expect(target).toHaveCount(1)
    await expect(target).toBeInViewport()
  })
})
