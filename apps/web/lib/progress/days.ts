/**
 * Calendar days for the reading activity (ADR-0007): a day is the reader's
 * local date as `YYYY-MM-DD`, and only the last 140 days (the 20 weeks the
 * heatmap shows) are kept.
 */

/** Days of activity kept and shown: 20 weeks. */
export const ACTIVITY_DAYS = 140

const MS_PER_DAY = 24 * 60 * 60 * 1000

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0")
}

/** The reader's local calendar date of `now`, e.g. `"2026-11-15"`. */
export function localDay(now: Date): string {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`
}

/** The day `offset` days after `day` (negative goes back). */
export function shiftDay(day: string, offset: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  return new Date(date.getTime() + offset * MS_PER_DAY)
    .toISOString()
    .slice(0, 10)
}

/** The first day inside the window that ends on `today`. */
export function firstActivityDay(today: string): string {
  return shiftDay(today, -(ACTIVITY_DAYS - 1))
}

/**
 * Drops days before the window that ends on `today`. Later days are kept: a
 * clock set back for a while must not erase them. Returns `activity` itself
 * when nothing is dropped.
 */
export function pruneActivity(
  activity: Record<string, string[]>,
  today: string
): Record<string, string[]> {
  const first = firstActivityDay(today)
  const days = Object.keys(activity)
  if (days.every((day) => day >= first)) return activity
  const kept: Record<string, string[]> = {}
  for (const day of days) {
    const ids = activity[day]
    if (day >= first && ids !== undefined) kept[day] = ids
  }
  return kept
}
