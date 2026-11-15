"use client"

import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { continueLesson } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * A topic page group section. The group holding the lesson to continue with
 * is tinted in the track colour; every group has the same border and
 * padding, so tinting changes only colours, never the layout (ADR-0014).
 * Its content is rendered on the server.
 */
export function GroupFrame({
  id,
  headingId,
  lessonIds,
  topicLessonIds,
  children,
}: {
  readonly id: string
  readonly headingId: string
  readonly lessonIds: readonly string[]
  readonly topicLessonIds: readonly string[]
  readonly children: ReactNode
}) {
  const next = continueLesson(useProgress(), topicLessonIds)
  const isActive = next !== undefined && lessonIds.includes(next)
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "flex scroll-mt-24 flex-col gap-3 rounded-2xl border p-4 sm:p-5",
        isActive ? "border-track/30 bg-track/5" : "border-transparent"
      )}
    >
      {children}
    </section>
  )
}
