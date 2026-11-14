import { site } from "./site"

/** Locale for every number and date shown in the UI: Bangla digits and month names. */
export const UI_LOCALE = "bn-BD"

const numberFormat = new Intl.NumberFormat(UI_LOCALE)

const twoDigitFormat = new Intl.NumberFormat(UI_LOCALE, {
  minimumIntegerDigits: 2,
  useGrouping: false,
})

const dateFormat = new Intl.DateTimeFormat(UI_LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  // Content dates are date-only (YYYY-MM-DD) and parse as UTC midnight, so
  // they are formatted in UTC to keep the build machine's zone from shifting them.
  timeZone: "UTC",
})

// An instant (e.g. the build time) belongs to the year of the site time zone.
const yearFormat = new Intl.DateTimeFormat(UI_LOCALE, {
  year: "numeric",
  timeZone: site.timeZone,
})

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** Formats a number with Bangla digits, e.g. `1234` → `"১,২৩৪"`. */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** Formats a number with at least two Bangla digits, e.g. `1` → `"০১"` (block numbers). */
export function formatTwoDigits(value: number): string {
  return twoDigitFormat.format(value)
}

/** Formats a date-only string (`YYYY-MM-DD`) as e.g. `"১১ নভেম্বর, ২০২৬"`. */
export function formatDate(isoDate: string): string {
  if (!DATE_ONLY.test(isoDate)) {
    throw new RangeError(`Expected a YYYY-MM-DD date, got "${isoDate}"`)
  }
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== isoDate
  ) {
    throw new RangeError(`Not a valid calendar date: "${isoDate}"`)
  }
  return dateFormat.format(date)
}

/** Formats the year of an instant in the site time zone, without grouping, e.g. `"২০২৬"`. */
export function formatYear(date: Date): string {
  return yearFormat.format(date)
}
