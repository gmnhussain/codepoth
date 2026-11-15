import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { expect, test } from "./support/test"

/** A path no route matches. */
const UNKNOWN_PATH = "/no-such-page"

test.describe("smoke", { tag: "@both" }, () => {
  test("home loads with the header and no layout shift", async ({ page }) => {
    await observeLayoutShifts(page)
    const response = await page.goto("/")
    expect(response?.status()).toBe(200)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(
      page.getByRole("button", { name: t("search.open") })
    ).toBeVisible()
    await page.waitForLoadState("load")
    expect(await layoutShiftTotal(page)).toBeLessThan(LAYOUT_SHIFT_LIMIT)
  })

  test("an unknown URL answers 404 with the not-found page", async ({
    page,
    browserProblems,
  }) => {
    // The browser logs the document's own 404 as a console error.
    browserProblems.allow(/status of 404/)
    const response = await page.goto(UNKNOWN_PATH)
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole("heading", { level: 1, name: t("notFound.title") })
    ).toBeVisible()
  })

  test("search finds the about page by its title", async ({ page }) => {
    await page.goto("/about")
    const title = await page.getByRole("heading", { level: 1 }).innerText()

    await page.getByRole("button", { name: t("search.open") }).click()
    const field = page.getByRole("searchbox", { name: t("search.field") })
    await expect(field).toBeFocused()
    await field.fill(title)

    const results = page.getByRole("list", { name: t("search.resultsLabel") })
    await expect(results.getByRole("link", { name: title })).toHaveAttribute(
      "href",
      "/about"
    )
  })
})
