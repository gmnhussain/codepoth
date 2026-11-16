import { readFile } from "node:fs/promises"

import type { Page } from "@playwright/test"

import { formatNumber } from "@workspace/config/format"

import { markDone, setBookmark } from "@/lib/progress/operations"
import type { Progress } from "@/lib/progress/progress.schema"
import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  MAX_IMPORT_BYTES,
  createExport,
  parseImport,
} from "@/lib/progress/transfer"

import { t } from "./support/labels"
import {
  LAYOUT_SHIFT_LIMIT,
  layoutShiftTotal,
  observeLayoutShifts,
} from "./support/layout-shift"
import { lessonIndex, lessonsOf } from "./support/lessons"
import type { BuiltLesson } from "./support/lessons"
import {
  EMPTY_PROGRESS,
  seedProgress,
  storedProgress,
} from "./support/progress"
import { expect, test } from "./support/test"

const BYTES_PER_MB = 1024 * 1024
const JSON_TYPE = "application/json"

let lessons: BuiltLesson[]

test.beforeAll(async ({ request }) => {
  lessons = lessonsOf(await lessonIndex(request))
  if (lessons.length < 2) throw new Error("the build has fewer than 2 lessons")
})

/** The nth lesson of the build (tests need two different ones). */
function lessonAt(index: number): BuiltLesson {
  const lesson = lessons[index]
  if (lesson === undefined) throw new Error(`no lesson ${String(index)}`)
  return lesson
}

/** Progress with one lesson done. */
function doneOne(lesson: BuiltLesson): Progress {
  return markDone(EMPTY_PROGRESS, lesson.id, new Date())
}

/** Ids of the lessons marked done in stored progress, sorted. */
function doneIds(progress: Progress): string[] {
  return Object.entries(progress.lessons)
    .filter(([, entry]) => entry.doneAt !== undefined)
    .map(([id]) => id)
    .sort()
}

/** Chooses a file through the import button's file picker. */
async function importFile(
  page: Page,
  trigger: string,
  file: { readonly name: string; readonly body: string | Buffer }
): Promise<void> {
  const chooser = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: trigger, exact: true }).click()
  await (
    await chooser
  ).setFiles({
    name: file.name,
    mimeType: JSON_TYPE,
    buffer: Buffer.from(file.body),
  })
}

/** An export file of the given progress, as the app writes it. */
function exportOf(progress: Progress): string {
  return JSON.stringify(createExport(progress, new Date()))
}

/** The announced result message (data-message.tsx). */
function announcement(page: Page, text: string) {
  return page.getByRole("status").filter({ hasText: text })
}

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await observeLayoutShifts(page)
  })

  test.afterEach(async ({ page }) => {
    expect(await layoutShiftTotal(page), "layout shift").toBeLessThan(
      LAYOUT_SHIFT_LIMIT
    )
  })

  test("a first visit shows the empty state with an import link", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await expect(page.getByText(t("dashboard.emptyTitle"))).toBeVisible()
    await expect(
      page.getByRole("button", { name: t("dashboard.importLink") })
    ).toBeVisible()
  })

  test("saved progress shows counts and bookmarks", async ({ page }) => {
    const done = lessonAt(0)
    const saved = lessonAt(1)
    await seedProgress(
      page,
      setBookmark(doneOne(done), saved.id, true, new Date())
    )
    await page.goto("/dashboard")

    await expect(
      page.getByRole("heading", { name: t("dashboard.overall") })
    ).toBeVisible()
    await expect(
      page.getByText(
        t("dashboard.fraction", {
          done: formatNumber(1),
          total: formatNumber(lessons.length),
        }),
        { exact: true }
      )
    ).toHaveCount(1)

    const bookmarks = page.getByRole("region", {
      name: t("dashboard.bookmarks"),
    })
    await expect(
      bookmarks.getByRole("link", { name: saved.title })
    ).toBeVisible()
    await bookmarks
      .getByRole("button", {
        name: t("dashboard.removeBookmark", { lesson: saved.title }),
      })
      .click()
    await expect(
      announcement(
        page,
        t("dashboard.bookmarkRemoved", { lesson: saved.title })
      )
    ).toHaveCount(1)
    await expect
      .poll(async () =>
        Object.hasOwn((await storedProgress(page)).bookmarks, saved.id)
      )
      .toBe(false)
  })

  test("export downloads the saved progress", async ({ page }) => {
    await seedProgress(page, doneOne(lessonAt(0)))
    await page.goto("/dashboard")
    const downloading = page.waitForEvent("download")
    await page.getByRole("button", { name: t("dashboard.export") }).click()
    const download = await downloading

    const path = await download.path()
    const result = parseImport(await readFile(path, "utf8"), new Date())
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual(await storedProgress(page))
    await expect(
      announcement(
        page,
        t("dashboard.exported", { file: download.suggestedFilename() })
      )
    ).toHaveCount(1)
  })

  test("importing into empty progress takes the file", async ({ page }) => {
    const lesson = lessonAt(0)
    await page.goto("/dashboard")
    await importFile(page, t("dashboard.importLink"), {
      name: "progress.json",
      body: exportOf(doneOne(lesson)),
    })
    await expect(
      page.getByRole("heading", { name: t("dashboard.overall") })
    ).toBeVisible()
    await expect
      .poll(async () => doneIds(await storedProgress(page)))
      .toEqual([lesson.id])
  })

  for (const mode of ["merge", "replace"] as const) {
    test(`importing with saved progress can ${mode}`, async ({ page }) => {
      const mine = lessonAt(0)
      const theirs = lessonAt(1)
      await seedProgress(page, doneOne(mine))
      await page.goto("/dashboard")
      await importFile(page, t("dashboard.import"), {
        name: "progress.json",
        body: exportOf(doneOne(theirs)),
      })

      const dialog = page.getByRole("dialog", {
        name: t("dashboard.importTitle"),
      })
      const label =
        mode === "merge"
          ? t("dashboard.importMerge")
          : t("dashboard.importReplace")
      await dialog
        .getByRole("button", { name: new RegExp(`^${label}`) })
        .click()
      await expect(dialog).toHaveCount(0)

      const expected =
        mode === "merge" ? [mine.id, theirs.id].sort() : [theirs.id]
      await expect
        .poll(async () => doneIds(await storedProgress(page)))
        .toEqual(expected)
      await expect(
        announcement(page, t("dashboard.imported", { file: "“progress.json”" }))
      ).toHaveCount(1)
    })
  }

  const badFiles = [
    {
      error: "dashboard.importNotJson",
      body: "this is not json",
    },
    {
      error: "dashboard.importWrongFormat",
      body: JSON.stringify({ format: "something-else" }),
    },
    {
      error: "dashboard.importUnsupportedVersion",
      body: JSON.stringify({
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION + 1,
        exportedAt: new Date().toISOString(),
        data: EMPTY_PROGRESS,
      }),
    },
    {
      error: "dashboard.importInvalidData",
      body: JSON.stringify({
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        data: { lessons: "not a map" },
      }),
    },
    {
      error: "dashboard.importTooLarge",
      body: Buffer.alloc(MAX_IMPORT_BYTES + 1, " "),
    },
  ] as const

  for (const file of badFiles) {
    test(`a bad file is refused: ${file.error}`, async ({ page }) => {
      const mine = lessonAt(0)
      await seedProgress(page, doneOne(mine))
      await page.goto("/dashboard")
      const before = await storedProgress(page)

      await importFile(page, t("dashboard.import"), {
        name: "progress.json",
        body: file.body,
      })
      const reason = t(file.error, { n: MAX_IMPORT_BYTES / BYTES_PER_MB })
      await expect(
        announcement(page, `${reason} ${t("dashboard.importUnchanged")}`)
      ).toHaveCount(1)
      expect(await storedProgress(page)).toEqual(before)
    })
  }

  test("clear all asks first; cancel keeps, confirm clears", async ({
    page,
  }) => {
    await seedProgress(page, doneOne(lessonAt(0)))
    await page.goto("/dashboard")
    const clear = page.getByRole("button", {
      name: t("dashboard.clearAll"),
      exact: true,
    })

    await clear.click()
    const dialog = page.getByRole("alertdialog", {
      name: t("dashboard.confirmTitle"),
    })
    await dialog.getByRole("button", { name: t("dashboard.cancel") }).click()
    await expect(dialog).toHaveCount(0)
    expect(doneIds(await storedProgress(page))).toHaveLength(1)

    await clear.click()
    await dialog
      .getByRole("button", { name: t("dashboard.confirmYes") })
      .click()
    await expect(page.getByText(t("dashboard.emptyTitle"))).toBeVisible()
    await expect(announcement(page, t("dashboard.cleared"))).toHaveCount(1)
    expect(doneIds(await storedProgress(page))).toEqual([])
  })
})
