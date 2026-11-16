import type { Page } from "@playwright/test"

import { SUFFIXES, trimWordSuffix } from "@/lib/search/trim-suffixes"

import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { lessonIndex, lessonsOf } from "./support/lessons"
import type { BuiltLesson } from "./support/lessons"
import { expect, test } from "./support/test"

/** Typed with key presses: Playwright's US layout, so Latin letters. */
const LATIN_QUERY = "react"
/** A query no page contains. */
const NONSENSE_QUERY = "zqxjvwk"
/** A Bangla word of three letters or more. */
const BANGLA_WORD = /\p{Script=Bengali}{3,}/gu

let lessons: BuiltLesson[]

test.beforeAll(async ({ request }) => {
  lessons = lessonsOf(await lessonIndex(request))
})

function searchButton(page: Page) {
  return page.getByRole("button", { name: t("search.open"), exact: true })
}

function searchField(page: Page) {
  return page.getByRole("searchbox", { name: t("search.field") })
}

function resultsList(page: Page) {
  return page.getByRole("list", { name: t("search.resultsLabel") })
}

/** A page whose idle prefetch of the dialog has run (ADR-0015). */
async function openPage(page: Page, path = "/"): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState("networkidle")
}

/** The href of every result row, in order, once results are shown. */
async function resultHrefs(page: Page): Promise<string[]> {
  const links = resultsList(page).getByRole("link")
  await expect(links.first()).toBeVisible()
  return links.evaluateAll((items) =>
    items.map((item) => item.getAttribute("href") ?? "")
  )
}

test.describe("search", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  test("Ctrl/⌘K opens search and keeps keys typed right after", async ({
    page,
  }) => {
    await openPage(page)
    await page.keyboard.press("ControlOrMeta+K")
    await page.keyboard.type(LATIN_QUERY)
    await expect(searchField(page)).toBeFocused()
    await expect(searchField(page)).toHaveValue(LATIN_QUERY)
  })

  test("a click opens search and keeps Bangla typed right after", async ({
    page,
  }) => {
    const word = lessons
      .flatMap((lesson) => lesson.title.match(BANGLA_WORD) ?? [])
      .at(0)
    if (word === undefined) throw new Error("no Bangla word in any title")
    await openPage(page)
    await searchButton(page).click()
    // An input method inserts composed text rather than key presses.
    await page.keyboard.insertText(word)
    await expect(searchField(page)).toHaveValue(word)
  })

  test("a lesson's title finds it; arrows move and Enter opens", async ({
    page,
  }) => {
    const [lesson] = lessons
    if (lesson === undefined) throw new Error("the build has no lessons")
    await openPage(page)
    await searchButton(page).click()
    await searchField(page).fill(lesson.title)
    expect(await resultHrefs(page)).toContain(lesson.url)

    const links = resultsList(page).getByRole("link")
    await page.keyboard.press("ArrowDown")
    await expect(links.first()).toBeFocused()
    if ((await links.count()) > 1) {
      await page.keyboard.press("ArrowDown")
      await expect(links.nth(1)).toBeFocused()
      await page.keyboard.press("ArrowUp")
      await expect(links.first()).toBeFocused()
    }
    await page.keyboard.press("ArrowUp")
    await expect(searchField(page)).toBeFocused()

    await page.keyboard.press("ArrowDown")
    const href = await links.first().getAttribute("href")
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(new RegExp(`${href ?? ""}$`))
    await expect(searchField(page)).toHaveCount(0)
  })

  test("a word with a suffix still finds the base word's top result", async ({
    page,
  }) => {
    // A title word the dialog trims back to itself once a suffix is added.
    const pair = lessons
      .flatMap((lesson) => lesson.title.match(BANGLA_WORD) ?? [])
      .flatMap((word) => SUFFIXES.map((suffix) => ({ word, suffix })))
      .find(
        ({ word, suffix }) =>
          trimWordSuffix(word) === word &&
          trimWordSuffix(`${word}${suffix}`) === word
      )
    if (pair === undefined) throw new Error("no title word takes a suffix")

    await openPage(page)
    await searchButton(page).click()
    await searchField(page).fill(pair.word)
    const [top] = await resultHrefs(page)

    await searchField(page).fill(`${pair.word}${pair.suffix}`)
    await expect.poll(async () => resultHrefs(page)).toContain(top)
  })

  test("no results says so and offers the contents page", async ({ page }) => {
    await openPage(page)
    await searchButton(page).click()
    await searchField(page).fill(NONSENSE_QUERY)
    await expect(
      page.getByText(t("search.noResults", { query: NONSENSE_QUERY }))
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: t("search.searchContents") })
    ).toHaveAttribute("href", `/contents?q=${NONSENSE_QUERY}`)
  })

  test("Escape closes search and returns focus", async ({ page }) => {
    await openPage(page)
    await searchButton(page).click()
    await expect(searchField(page)).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(searchField(page)).toHaveCount(0)
    await expect(searchButton(page)).toBeFocused()
  })
})
