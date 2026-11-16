import type { Page } from "@playwright/test"

import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { expect, test } from "./support/test"

/** The narrowest width the site supports (WCAG reflow). */
const PHONE = { width: 320, height: 720 }

function isDark(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  )
}

test.describe("site shell", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  test("the theme toggle switches to dark and back, and is kept", async ({
    page,
  }) => {
    await page.goto("/")
    expect(await isDark(page)).toBe(false)

    await page.getByRole("button", { name: t("theme.toDark") }).click()
    await expect.poll(() => isDark(page)).toBe(true)
    // An action button named for what it does next (design.md).
    await expect(
      page.getByRole("button", { name: t("theme.toLight") })
    ).toBeVisible()

    await page.reload()
    expect(await isDark(page)).toBe(true)

    await page.getByRole("button", { name: t("theme.toLight") }).click()
    await expect.poll(() => isDark(page)).toBe(false)
  })

  test.describe("on a phone", () => {
    test.use({ viewport: PHONE })

    test("the menu opens, closes with Escape and returns focus", async ({
      page,
    }) => {
      await page.goto("/")
      const menu = page.getByRole("button", { name: t("nav.menu") })
      await menu.click()
      const nav = page.getByRole("navigation", { name: t("nav.mobile") })
      await expect(nav).toBeVisible()
      await expect(
        nav.getByRole("link", { name: t("nav.roadmap") })
      ).toBeVisible()

      await page.keyboard.press("Escape")
      await expect(nav).toHaveCount(0)
      await expect(menu).toBeFocused()
    })

    test("a menu link navigates and closes the menu", async ({ page }) => {
      await page.goto("/")
      await page.getByRole("button", { name: t("nav.menu") }).click()
      const nav = page.getByRole("navigation", { name: t("nav.mobile") })
      await nav.getByRole("link", { name: t("nav.contents") }).click()
      await expect(page).toHaveURL(/\/contents$/)
      await expect(nav).toHaveCount(0)
    })

    test("the menu holds the theme toggle below sm", async ({ page }) => {
      await page.goto("/")
      await page.getByRole("button", { name: t("nav.menu") }).click()
      await page
        .getByRole("dialog")
        .getByRole("button", { name: t("theme.toDark") })
        .click()
      await expect.poll(() => isDark(page)).toBe(true)
    })
  })
})
