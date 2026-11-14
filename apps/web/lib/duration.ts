import { t } from "@workspace/config/t"
import { roundedDuration } from "@workspace/content/reading-time"

/** "মোট ~৪৫ মিনিট" or "মোট ~২ ঘণ্টা" for a group's or topic's reading time. */
export function totalTimeLabel(minutes: number): string {
  const { unit, value } = roundedDuration(minutes)
  return unit === "hours"
    ? t("topic.totalHours", { n: value })
    : t("topic.totalMinutes", { n: value })
}
