"use client"

import { formatNumber } from "@workspace/config/format"
import { Progress, ProgressLabel } from "@workspace/ui/components/progress"

import { useT } from "@/lib/labels-context"
import type { Progress as ReaderProgress } from "@/lib/progress/progress.schema"
import { summarize } from "@/lib/progress/selectors"

/**
 * "মোট অগ্রগতি": the share of all lessons done, a bar, and three counts:
 * lessons done, quizzes taken and topics finished.
 */
export function OverallCard({
  progress,
  lessonIds,
  topics,
}: {
  readonly progress: ReaderProgress
  readonly lessonIds: readonly string[]
  readonly topics: Readonly<Record<string, readonly string[]>>
}) {
  const t = useT(["dashboard"])
  const { done, total } = summarize(progress, lessonIds)
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const quizzes = lessonIds.filter(
    (id) =>
      Object.hasOwn(progress.lessons, id) &&
      progress.lessons[id]?.quiz !== undefined
  ).length
  const topicLists = Object.values(topics)
  const topicsDone = topicLists.filter(
    (ids) => summarize(progress, ids).state === "done"
  ).length
  const stats = [
    { label: t("dashboard.statRead"), done, total },
    { label: t("dashboard.statQuiz"), done: quizzes, total },
    {
      label: t("dashboard.statTopics"),
      done: topicsDone,
      total: topicLists.length,
    },
  ]

  return (
    <section
      aria-labelledby="overall-heading"
      className="flex flex-col gap-5 rounded-2xl border bg-card p-6"
    >
      <Progress
        value={percent}
        getAriaValueText={() => t("dashboard.percent", { n: percent })}
        className="flex-col gap-4 [&_[data-slot=progress-indicator]]:bg-foreground [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-2.5"
      >
        <ProgressLabel
          id="overall-heading"
          className="text-sm font-semibold text-muted-foreground"
          render={<h2 />}
        >
          {t("dashboard.overall")}
        </ProgressLabel>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <span className="font-heading text-6xl leading-none font-bold">
            {t("dashboard.percent", { n: percent })}
          </span>
          <span className="pb-1 text-foreground/80">
            {t("dashboard.overallText", { total })}
          </span>
        </div>
      </Progress>
      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col-reverse rounded-xl border px-4 py-3"
          >
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="font-heading text-2xl font-semibold">
              {t("dashboard.fraction", {
                done: formatNumber(stat.done),
                total: formatNumber(stat.total),
              })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
