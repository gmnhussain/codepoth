import { contentGraph, draftLessons } from "./support/content"
import { t } from "./support/labels"
import { expect, test } from "./support/test"

/**
 * The build without drafts is the production content: no draft may be
 * served or found, and pages with nothing published show their empty state.
 */
test.describe("production content", { tag: "@published" }, () => {
  test("no draft lesson is served", async ({ request }) => {
    for (const lesson of draftLessons()) {
      const response = await request.get(lesson.url)
      expect(response.status(), lesson.url).toBe(404)
    }
  })

  test("search finds no draft lesson", async ({ page }) => {
    const [draft] = draftLessons()
    test.skip(draft === undefined, "every lesson is published")
    if (draft === undefined) return

    await page.goto("/")
    await page.getByRole("button", { name: t("search.open") }).click()
    const field = page.getByRole("searchbox", { name: t("search.field") })
    await field.fill(draft.title)

    const noResults = page.getByText(
      t("search.noResults", { query: draft.title })
    )
    const results = page.getByRole("list", { name: t("search.resultsLabel") })
    await expect(noResults.or(results)).toBeVisible()
    await expect(page.locator(`a[href="${draft.url}"]`)).toHaveCount(0)
  })

  test("the glossary shows its empty state when no term is published", async ({
    page,
  }) => {
    const hasTerms = contentGraph(false).glossary.length > 0
    await page.goto("/glossary")
    const empty = page.getByText(t("glossary.empty"))
    if (hasTerms) await expect(empty).toHaveCount(0)
    else await expect(empty).toBeVisible()
  })
})
