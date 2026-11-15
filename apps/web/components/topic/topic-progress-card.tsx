"use client"

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@workspace/ui/components/button"
import { Progress, ProgressLabel } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import { continueLesson, summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/** A topic lesson as the card needs it. */
export type CardLesson = {
  readonly id: string
  readonly title: string
  readonly url: string
  readonly groupTitle?: string | undefined
}

/** Grid-stacked layer: all layers share one cell; only one is visible. */
const LAYER = "col-start-1 row-start-1 flex flex-col gap-4"

/**
 * The topic page's card for where the reader stands:
 * - not started (and in the first-visit HTML): "এই স্টেশন শুরু করো" and the
 *   first lesson;
 * - in progress: lessons done with a bar, the next unfinished lesson and
 *   "চালিয়ে যাও";
 * - all done: a full bar, "পরের স্টেশন: …" when there is one, and "আবার দেখো".
 *
 * All states are rendered in one grid cell and only the reader's is visible
 * (hidden ones are not focusable or read). An extra invisible layer shows
 * "in progress" with the topic's longest lesson title, so the card is as
 * tall as it can get from the first render: switching state never moves the
 * lessons below it (ADR-0014).
 */
export function TopicProgressCard({
  lessons,
  nextTopic,
}: {
  readonly lessons: readonly CardLesson[]
  readonly nextTopic?: { readonly title: string; readonly url: string }
}) {
  const t = useT(["topic"])
  const progress = useProgress()
  const ids = lessons.map((lesson) => lesson.id)
  const { done, total, state } = summarize(progress, ids)
  const first = lessons[0]
  if (first === undefined) return null
  const nextId = continueLesson(progress, ids)
  const next = lessons.find((lesson) => lesson.id === nextId) ?? first
  const longest = lessons.reduce((widest, lesson) =>
    lesson.title.length + (lesson.groupTitle?.length ?? 0) >
    widest.title.length + (widest.groupTitle?.length ?? 0)
      ? lesson
      : widest
  )
  const progressText = t("topic.progress", { total, done })
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  const bar = (
    <Progress
      value={percent}
      getAriaValueText={() => progressText}
      className="flex-col gap-3 [&_[data-slot=progress-indicator]]:bg-track-dot [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-2.5"
    >
      <ProgressLabel className="font-heading text-3xl leading-tight font-bold">
        {progressText}
      </ProgressLabel>
    </Progress>
  )
  const progressLayer = (lesson: CardLesson, isVisible: boolean) => (
    <div className={cn(LAYER, !isVisible && "invisible")}>
      <h2 className="text-sm font-semibold text-muted-foreground">
        {t("topic.yourProgress")}
      </h2>
      {bar}
      <p className="text-foreground/80">
        {t("topic.nextUp")}:{" "}
        <strong className="text-foreground">{lesson.title}</strong>
        {lesson.groupTitle === undefined ? null : (
          <>
            <span aria-hidden="true"> · </span>
            {lesson.groupTitle}
          </>
        )}
      </p>
      <Link href={lesson.url} className={cn(buttonVariants(), "self-start")}>
        {t("topic.continue")}
        <ArrowRightIcon aria-hidden="true" />
      </Link>
    </div>
  )

  return (
    <section
      aria-label={
        state === "not-started"
          ? t("topic.startHeading")
          : t("topic.yourProgress")
      }
      className="flex flex-col gap-4 rounded-2xl border border-track/30 bg-track/5 p-6"
    >
      <div className="grid">
        <div
          className={cn(
            LAYER,
            "sm:flex-row sm:items-center sm:justify-between",
            state !== "not-started" && "invisible"
          )}
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">{t("topic.startHeading")}</h2>
            <p className="text-sm text-foreground/80">
              {t("topic.firstLesson", { lesson: first.title })}
            </p>
          </div>
          <Link
            href={first.url}
            className={cn(buttonVariants(), "self-start sm:self-auto")}
          >
            {t("topic.start")}
          </Link>
        </div>
        {progressLayer(next, state === "in-progress")}
        {progressLayer(longest, false)}
        <div className={cn(LAYER, state !== "done" && "invisible")}>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("topic.yourProgress")}
          </h2>
          {bar}
          <p className="text-foreground/80">
            {nextTopic === undefined
              ? t("topic.allDoneLast")
              : t("topic.allDone")}
          </p>
          <div className="flex flex-wrap gap-2">
            {nextTopic === undefined ? null : (
              <Link href={nextTopic.url} className={buttonVariants()}>
                {t("topic.goNext", { topic: nextTopic.title })}
              </Link>
            )}
            <Link
              href={first.url}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("topic.review")}
            </Link>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("topic.savedNote")}</p>
    </section>
  )
}
