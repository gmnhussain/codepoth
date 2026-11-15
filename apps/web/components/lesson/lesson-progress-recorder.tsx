"use client"

import { useEffect, useState } from "react"

import { createAnchorGate } from "@/components/lesson/anchor-gate"
import { useActiveId } from "@/components/lesson/use-active-id"
import { recordAnchor, recordOpen } from "@/lib/progress/operations"
import { updateProgress } from "@/lib/progress-store.client"

/** How long the current section must stay put before it is saved. */
const ANCHOR_DELAY_MS = 1000

/**
 * Records reading in the reader's progress (ADR-0014): once per page view,
 * the lesson as opened (first visit only), last read and part of today's
 * activity; then, once the reader has moved past the section the page
 * opened at, the section they are in, saved once it has stayed the same for
 * a second (or when the page is hidden first), so scrolling past many
 * sections writes once. Renders nothing.
 */
export function LessonProgressRecorder({
  lessonId,
  sectionIds,
}: {
  readonly lessonId: string
  readonly sectionIds: readonly string[]
}) {
  const activeId = useActiveId(sectionIds)
  const [shouldSaveAnchor] = useState(createAnchorGate)

  useEffect(() => {
    // Not saved (storage blocked or full): reading goes on unrecorded.
    void updateProgress((progress) =>
      recordOpen(progress, lessonId, new Date())
    )
  }, [lessonId])

  useEffect(() => {
    if (activeId === undefined || !shouldSaveAnchor(lessonId, activeId)) return
    // Saved once: a later pagehide must not take lastRead back from a lesson
    // another tab has opened since.
    let isPending = true
    const save = (): void => {
      if (!isPending) return
      isPending = false
      void updateProgress((progress) =>
        recordAnchor(progress, lessonId, activeId, new Date())
      )
    }
    const timer = window.setTimeout(save, ANCHOR_DELAY_MS)
    window.addEventListener("pagehide", save)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("pagehide", save)
    }
  }, [lessonId, activeId, shouldSaveAnchor])

  return null
}
