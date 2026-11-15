"use client"

import { Progress, ProgressLabel } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import { summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/** A share of 100 for a progress bar; 0 for an empty list. */
function percentOf(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

/**
 * "তোমার অগ্রগতি" under the lesson's table of contents: the group's lessons
 * done, with a bar in the track colour, and the topic's below it (a lesson
 * outside a group shows the topic only). The first-visit HTML shows zero
 * done; the numbers and bars change in place once progress is read.
 */
export function LessonProgressCard({
  topic,
  group,
}: {
  readonly topic: {
    readonly title: string
    readonly lessonIds: readonly string[]
  }
  readonly group?:
    | { readonly title: string; readonly lessonIds: readonly string[] }
    | undefined
}) {
  const t = useT(["lesson"])
  const progress = useProgress()
  const topicSummary = summarize(progress, topic.lessonIds)
  const topicText = t("lesson.topicProgress", {
    topic: topic.title,
    total: topicSummary.total,
    done: topicSummary.done,
  })
  const groupSummary =
    group === undefined ? undefined : summarize(progress, group.lessonIds)
  const main =
    group === undefined || groupSummary === undefined
      ? { text: topicText, summary: topicSummary }
      : {
          text: t("lesson.groupProgress", {
            group: group.title,
            total: groupSummary.total,
            done: groupSummary.done,
          }),
          summary: groupSummary,
        }

  // Base UI's Progress names the bar by its label and gives the value as
  // text; the bar itself is in the track colour (main) or muted (topic).
  const barStyles =
    "flex-col gap-2 [&_[data-slot=progress-indicator]]:motion-reduce:transition-none"

  return (
    <section
      aria-labelledby="lesson-progress-heading"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <h2
        id="lesson-progress-heading"
        className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {t("lesson.yourProgress")}
      </h2>
      <Progress
        value={percentOf(main.summary.done, main.summary.total)}
        getAriaValueText={() => main.text}
        className={cn(
          barStyles,
          "[&_[data-slot=progress-indicator]]:bg-track-dot [&_[data-slot=progress-track]]:h-1.5"
        )}
      >
        <ProgressLabel className="font-heading text-base leading-snug font-semibold">
          {main.text}
        </ProgressLabel>
      </Progress>
      {group === undefined ? null : (
        <Progress
          value={percentOf(topicSummary.done, topicSummary.total)}
          getAriaValueText={() => topicText}
          className={cn(
            barStyles,
            "[&_[data-slot=progress-indicator]]:bg-muted-foreground [&_[data-slot=progress-track]]:h-1"
          )}
        >
          <ProgressLabel className="text-xs font-normal text-muted-foreground">
            {topicText}
          </ProgressLabel>
        </Progress>
      )}
    </section>
  )
}
