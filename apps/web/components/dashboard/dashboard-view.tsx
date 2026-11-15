"use client"

import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { BookmarkList } from "@/components/dashboard/bookmark-list"
import { MyMap } from "@/components/dashboard/my-map"
import { OverallCard } from "@/components/dashboard/overall-card"
import { QuizResults } from "@/components/dashboard/quiz-results"
import { ReadingHeatmap } from "@/components/dashboard/reading-heatmap"
import { ResumeCard } from "@/components/dashboard/resume-card"
import { TrackProgressList } from "@/components/dashboard/track-progress-list"
import type { DashboardData } from "@/lib/dashboard-data"
import { useT } from "@/lib/labels-context"
import { resumeOf } from "@/lib/progress/resume"
import { lastSaved } from "@/lib/progress/selectors"
import { useProgress, useProgressReady } from "@/lib/progress-store.client"
import { useToday } from "@/lib/use-today"

/**
 * The Dashboard's body. Until the reader's progress is read it shows an
 * empty placeholder (the prerendered HTML too, with the empty state in
 * `<noscript>`), so a returning reader never sees "nothing saved" flash.
 * Then: the empty state when nothing is saved, otherwise overall progress
 * (beside "শেষবার পড়েছ" when the last-read lesson is in the build),
 * per-track bars, "আমার ম্যাপ", quiz results, bookmarks and the reading
 * heatmap.
 *
 * The body is at least a screen tall in every state, so swapping one state
 * for another never moves anything in view (the footer stays below the
 * fold).
 */
export function DashboardView({
  data,
  emptyState,
}: {
  readonly data: DashboardData
  readonly emptyState: ReactNode
}) {
  const t = useT(["dashboard"])
  const isReady = useProgressReady()
  const progress = useProgress()
  const today = useToday()
  const frame = "min-h-svh"

  if (!isReady || today === "") {
    return (
      <div aria-busy="true" className={frame}>
        <p className="sr-only">{t("dashboard.loading")}</p>
        <noscript>{emptyState}</noscript>
      </div>
    )
  }
  if (lastSaved(progress) === undefined) {
    return <div className={frame}>{emptyState}</div>
  }

  const lessonIds = Object.keys(data.lessons)
  const resume = resumeOf(progress, data)
  const resumePath =
    progress.lastRead === undefined
      ? undefined
      : data.lessons[progress.lastRead.id]?.path
  return (
    <div className={cn(frame, "grid content-start gap-5 lg:grid-cols-2")}>
      {/* Overall progress, beside the resume card when there is one. */}
      <div className={cn(resume === undefined && "lg:col-span-2")}>
        <OverallCard
          progress={progress}
          lessonIds={lessonIds}
          topics={data.topics}
        />
      </div>
      {resume === undefined || resumePath === undefined ? null : (
        <ResumeCard resume={resume} path={resumePath} />
      )}
      <TrackProgressList progress={progress} tracks={data.tracks} />
      <MyMap progress={progress} map={data.map} topics={data.topics} />
      <QuizResults progress={progress} lessons={data.lessons} />
      <BookmarkList progress={progress} lessons={data.lessons} />
      <div className="lg:col-span-2">
        <ReadingHeatmap progress={progress} today={today} />
      </div>
    </div>
  )
}
