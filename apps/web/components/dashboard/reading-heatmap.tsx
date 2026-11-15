"use client"

import { formatDate } from "@workspace/config/format"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import type { Progress } from "@/lib/progress/progress.schema"
import type { HeatLevel } from "@/lib/progress/selectors"
import {
  HEAT_LEVELS,
  activityByDay,
  heatLevelOf,
} from "@/lib/progress/selectors"

/** Cell size and gap in SVG units; 7 rows (days) by 20 columns (weeks). */
const CELL = 14
const GAP = 4
const DAYS_PER_WEEK = 7

/** The shade per level (design.md: muted, then success at three strengths). */
const LEVEL_FILL = {
  0: "fill-muted",
  1: "fill-success/35",
  2: "fill-success/65",
  3: "fill-success",
} as const satisfies Record<HeatLevel, string>

/**
 * "যেদিন পড়েছ": lessons read per day for the last 20 weeks as an SVG grid
 * (one column per week, oldest first), with a key. The grid is decorative;
 * a visually hidden table gives every day's count to screen readers.
 */
export function ReadingHeatmap({
  progress,
  today,
}: {
  readonly progress: Progress
  readonly today: string
}) {
  const t = useT(["dashboard"])
  const days = activityByDay(progress, today)
  const weeks = Array.from(
    { length: Math.ceil(days.length / DAYS_PER_WEEK) },
    (_, week) => days.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK)
  )
  const readDays = days.filter((day) => day.count > 0).length
  const width = weeks.length * (CELL + GAP) - GAP
  const height = DAYS_PER_WEEK * (CELL + GAP) - GAP

  return (
    <section
      aria-labelledby="heatmap-heading"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="heatmap-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          {t("dashboard.readDays")}
        </h2>
        <p className="text-sm text-foreground/80">
          {t("dashboard.readDaysText", { n: readDays })}
        </p>
      </div>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className="block h-auto w-full max-w-xl"
      >
        {weeks.map((week, column) =>
          week.map((day, row) => (
            <rect
              key={day.day}
              x={column * (CELL + GAP)}
              y={row * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={3}
              className={LEVEL_FILL[heatLevelOf(day.count)]}
            />
          ))
        )}
      </svg>
      <div
        aria-hidden="true"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        {t("dashboard.heatLess")}
        {HEAT_LEVELS.map((level) => (
          <svg key={level} viewBox="0 0 14 14" className="size-3.5">
            <rect
              width={14}
              height={14}
              rx={3}
              className={cn(LEVEL_FILL[level])}
            />
          </svg>
        ))}
        {t("dashboard.heatMore")}
      </div>
      <table className="sr-only">
        <caption>{t("dashboard.heatTable")}</caption>
        <thead>
          <tr>
            <td />
            {Array.from({ length: DAYS_PER_WEEK }, (_, index) => (
              <th key={index} scope="col">
                {t("dashboard.heatDay", { n: index + 1 })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => (
            <tr key={week[0]?.day ?? index}>
              <th scope="row">{t("dashboard.heatWeek", { n: index + 1 })}</th>
              {week.map((day) => (
                <td key={day.day}>
                  {t("dashboard.heatCell", {
                    date: formatDate(day.day),
                    n: day.count,
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
