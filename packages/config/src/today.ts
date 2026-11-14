import { site } from "./site"

/**
 * Calendar date (YYYY-MM-DD) of `now` in `timeZone`. "en-CA" is used only
 * because it formats dates as YYYY-MM-DD with Latin digits.
 */
export function dateIn(timeZone: string, now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

/**
 * Today's date in the site's time zone, the zone authors date lessons in.
 * Used for the build date: the future-date check and "new / updated" tags.
 */
export function siteToday(now: Date = new Date()): string {
  return dateIn(site.timeZone, now)
}
