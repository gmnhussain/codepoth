import type { Page } from "@playwright/test"

import { EMPTY_PROGRESS } from "@/lib/progress/empty-progress"
import { progressSchema } from "@/lib/progress/progress.schema"
import type { Progress } from "@/lib/progress/progress.schema"
import { PROGRESS_STORAGE_KEY } from "@/lib/progress-store.client"

export { EMPTY_PROGRESS }

/** Marks a tab as seeded, so a reload or navigation keeps what the app wrote. */
const SEEDED_FLAG = "codepoth-e2e-seeded"

/**
 * Stores reader progress before the first page loads, as the app would have
 * written it. Build the value with the app's own operations
 * (`lib/progress/operations.ts`), so it always has the stored shape
 * (ADR-0007). It is written once per tab: later loads keep the app's
 * changes.
 */
export async function seedProgress(
  page: Page,
  progress: Progress
): Promise<void> {
  await page.addInitScript(
    ({ key, flag, value }) => {
      if (sessionStorage.getItem(flag) !== null) return
      localStorage.setItem(key, value)
      sessionStorage.setItem(flag, "1")
    },
    {
      key: PROGRESS_STORAGE_KEY,
      flag: SEEDED_FLAG,
      value: JSON.stringify(progress),
    }
  )
}

/** The reader progress the page has stored, checked with the app's schema. */
export async function storedProgress(page: Page): Promise<Progress> {
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    PROGRESS_STORAGE_KEY
  )
  if (raw === null) return EMPTY_PROGRESS
  return progressSchema.parse(JSON.parse(raw))
}
