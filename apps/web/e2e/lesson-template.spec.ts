import type { Locator, Page } from "@playwright/test"

import { GENERATED_SECTIONS, LESSON_BLOCKS } from "@workspace/content/blocks"
import { LESSON_GOALS } from "@workspace/content/schemas/lesson"

import { t } from "./support/labels"
import { builtHtmlOf, builtPageRoutes, isLessonRoute } from "./support/routes"
import { expect, test } from "./support/test"

/** Hint labels a test may meet: far more than an exercise has. */
const HINT_LABELS = new Set(
  Array.from({ length: 10 }, (_, index) => t("lesson.hint", { n: index + 1 }))
)

/** A word in a solution: one Latin run, or Bangla letters. */
const SEARCH_WORD = /\b[a-z]{6,}\b|\p{Script=Bengali}{3,}/gu

/** Pagefind's browser module, written by the build next to the index. */
const PAGEFIND_URL = "/pagefind/pagefind.js"

let url: string

// A lesson with every part of the template this spec checks, chosen from
// the build by rule, never by name (ADR-0018).
test.beforeAll(() => {
  const markers = [
    `id="${GENERATED_SECTIONS.goals}"`,
    `id="${GENERATED_SECTIONS.resources}"`,
    'id="mistakes"',
    t("lesson.think"),
    t("lesson.deepTag"),
    t("lesson.hint", { n: 2 }),
    t("lesson.showSolution"),
  ]
  const found = builtPageRoutes()
    .filter(isLessonRoute)
    .find((route) => {
      const html = builtHtmlOf(route)
      return (
        markers.every((marker) => html.includes(marker)) &&
        /hreflang="en"/i.test(html)
      )
    })
  if (found === undefined) {
    throw new Error("no lesson in the build has every template part")
  }
  url = found
})

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function exactly(text: string): RegExp {
  return new RegExp(`^${escapeRegExp(text)}$`)
}

/** The <summary> whose whole text is `label`. */
function summaryNamed(scope: Page | Locator, label: string): Locator {
  return scope.locator("summary").filter({ hasText: exactly(label) })
}

/** The <details> a summary belongs to. */
function detailsOf(summary: Locator): Locator {
  return summary.locator("xpath=..")
}

/** Opens a <details> by keyboard: focus its summary, press Enter. */
async function openByKeyboard(summary: Locator): Promise<void> {
  const details = detailsOf(summary)
  await expect(details).not.toHaveAttribute("open")
  await summary.focus()
  await expect(summary).toBeFocused()
  await summary.press("Enter")
  await expect(details).toHaveAttribute("open", "")
}

function toc(page: Page): Locator {
  return page
    .getByRole("navigation", { name: t("lesson.inThisLesson") })
    .filter({ visible: true })
}

test.describe("lesson template", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url)
  })

  test("goals sit under their label, before the first block", async ({
    page,
  }) => {
    const goals = page.getByRole("region", { name: t("lesson.goals") })
    await expect(goals).toBeVisible()
    expect(await goals.getByRole("listitem").count()).toBeGreaterThanOrEqual(
      LESSON_GOALS.min
    )
    const goalsFirst = await goals.evaluate((element) => {
      const first = document.querySelector("article section[id]")
      return (
        first !== null &&
        (element.compareDocumentPosition(first) &
          Node.DOCUMENT_POSITION_FOLLOWING) !==
          0
      )
    })
    expect(goalsFirst).toBe(true)
  })

  test("blocks come in the template's order, then further reading", async ({
    page,
  }) => {
    const ids = await page
      .locator("article section[id]")
      .evaluateAll((sections) => sections.map((section) => section.id))
    const blockIds: readonly string[] = LESSON_BLOCKS.map((block) => block.id)
    const present = ids.filter((id) => blockIds.includes(id))
    expect(present).toEqual(blockIds.filter((id) => present.includes(id)))
    expect(present.indexOf("summary")).toBeGreaterThan(
      present.indexOf("mistakes")
    )
    expect(present.indexOf("summary")).toBeLessThan(present.indexOf("quiz"))
    expect(ids.at(-1)).toBe(GENERATED_SECTIONS.resources)
  })

  test("block headings and TOC entries carry no numbers", async ({ page }) => {
    const ids = await page
      .locator("article section[id]")
      .evaluateAll((sections) => sections.map((section) => section.id))
    for (const block of LESSON_BLOCKS) {
      if (!ids.includes(block.id)) continue
      const label = t(`blocks.${block.id}`)
      await expect(page.locator(`#${block.id}-heading`)).toHaveText(
        exactly(label)
      )
      await expect(toc(page).locator(`a[href="#${block.id}"]`)).toHaveText(
        exactly(label)
      )
    }
  })

  test("the TOC lists further reading and nothing inside a card", async ({
    page,
  }) => {
    await expect(
      toc(page).locator(`a[href="#${GENERATED_SECTIONS.resources}"]`)
    ).toHaveText(exactly(t("lesson.resources")))

    const entries = await toc(page)
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((link) => ({
          id: decodeURIComponent((link.getAttribute("href") ?? "").slice(1)),
          text: link.textContent,
        }))
      )
    // Exercise titles have no id; DeepDive titles sit in a <summary>.
    const cardTitles = await page
      .locator("article h3:not([id]), article summary")
      .evaluateAll((items) => items.map((item) => item.textContent))
    for (const entry of entries) {
      const inDetails = await page
        .locator(`[id="${entry.id}"]`)
        .evaluate((target) => target.closest("details") !== null)
      expect(inDetails, `#${entry.id} is inside a <details>`).toBe(false)
      expect(cardTitles).not.toContain(entry.text)
      expect(entry.text).not.toBe(t("lesson.think"))
    }
  })

  test("a Think answer opens by keyboard", async ({ page }) => {
    await openByKeyboard(summaryNamed(page, t("lesson.showAnswer")).first())
  })

  test("a DeepDive opens by keyboard", async ({ page }) => {
    await openByKeyboard(
      page.locator("summary", { hasText: t("lesson.deepTag") }).first()
    )
  })

  test("hints show one at a time; the solution never waits", async ({
    page,
  }) => {
    const second = summaryNamed(page, t("lesson.hint", { n: 2 })).first()
    const hints = detailsOf(second).locator("xpath=..")
    const exercise = hints.locator("xpath=..")
    const first = summaryNamed(hints, t("lesson.hint", { n: 1 }))

    await expect(first).toBeVisible()
    await expect(second).toBeHidden()

    // With every hint closed, the solution is there and opens.
    const solution = summaryNamed(exercise, t("lesson.showSolution"))
    await expect(solution).toBeVisible()
    await openByKeyboard(solution)
    await expect(detailsOf(first)).not.toHaveAttribute("open")
    await expect(second).toBeHidden()

    await openByKeyboard(first)
    await expect(second).toBeVisible()
  })

  test("answers, hints, solutions and further reading stay out of search", async ({
    page,
  }) => {
    const spoilers = await page
      .locator("article details")
      .evaluateAll((items) =>
        items.map((item) => ({
          summary: item.querySelector(":scope > summary")?.textContent ?? "",
          ignored: item.getAttribute("data-pagefind-ignore"),
        }))
      )
    const hidden = new Set([
      t("lesson.showAnswer"),
      t("lesson.showSolution"),
      ...HINT_LABELS,
    ])
    const checked = spoilers.filter((item) => hidden.has(item.summary))
    expect(checked.length).toBeGreaterThan(0)
    for (const item of checked) {
      expect(item.ignored, item.summary).toBe("all")
    }
    await expect(
      page.getByRole("region", { name: t("lesson.resources") })
    ).toHaveAttribute("data-pagefind-ignore", "all")
  })

  test("a solution's words are not in the lesson's search record", async ({
    page,
  }) => {
    const { solutions, indexed } = await page.evaluate((label) => {
      const article = document.querySelector("article[data-pagefind-body]")
      if (article === null) throw new Error("no indexed article")
      const solutionText = [...article.querySelectorAll("details")]
        .filter(
          (item) =>
            item.querySelector(":scope > summary")?.textContent === label
        )
        .map((item) => item.querySelector(":scope > div")?.textContent ?? "")
        .join(" ")
      const copy = article.cloneNode(true) as Element
      for (const ignored of copy.querySelectorAll("[data-pagefind-ignore]")) {
        ignored.remove()
      }
      return {
        solutions: solutionText,
        indexed: `${document.title} ${copy.textContent}`.toLowerCase(),
      }
    }, t("lesson.showSolution"))
    const words = [...new Set(solutions.match(SEARCH_WORD))].filter(
      (word) => !indexed.includes(word.toLowerCase())
    )
    expect(words.length, "words only a solution has").toBeGreaterThan(0)

    // The lesson's record in the built index, found by its title. Pagefind
    // matches Bangla words loosely, so a query could find the lesson by its
    // own text; the record's content is the exact check.
    const content = await page.evaluate(
      async ({ pagefindUrl, title, lessonUrl }) => {
        type Result = {
          data: () => Promise<{ url: string; content: string }>
        }
        const pagefind = (await import(pagefindUrl)) as {
          search: (query: string) => Promise<{ results: Result[] }>
        }
        const { results } = await pagefind.search(title)
        for (const result of results) {
          const data = await result.data()
          if (data.url === lessonUrl) return data.content.toLowerCase()
        }
        return undefined
      },
      {
        pagefindUrl: PAGEFIND_URL,
        title: await page.getByRole("heading", { level: 1 }).innerText(),
        lessonUrl: url,
      }
    )
    if (content === undefined) throw new Error(`${url} is not in the index`)
    for (const word of words) {
      expect(content, `"${word}" is in the index`).not.toContain(
        word.toLowerCase()
      )
    }
  })

  test("further-reading links open in a new tab and mark English", async ({
    page,
  }) => {
    const links = page
      .getByRole("region", { name: t("lesson.resources") })
      .getByRole("link")
    expect(await links.count()).toBeGreaterThan(0)
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute("target", "_blank")
      await expect(link).toHaveAttribute("rel", "noopener noreferrer")
      await expect(link).toHaveAccessibleName(
        new RegExp(`${escapeRegExp(t("lesson.opensInNewTab"))}$`)
      )
      const isEnglish = (await link.getAttribute("hreflang")) === "en"
      await expect(
        link.getByText(t("lesson.langEn"), { exact: true })
      ).toHaveCount(isEnglish ? 1 : 0)
    }
  })
})
