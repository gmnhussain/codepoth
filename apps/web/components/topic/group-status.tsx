"use client"

import { CheckIcon } from "lucide-react"

import { Chip } from "@/components/chip"
import { useT } from "@/lib/labels-context"
import { continueLesson, summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * "এখন পড়ছ" on the group holding the lesson to continue with, "গ্রুপ শেষ"
 * on a finished group. It sits on the group's kicker line, which is always
 * as tall as a chip, so a chip appearing never moves the page.
 */
export function GroupStatus({
  lessonIds,
  topicLessonIds,
}: {
  readonly lessonIds: readonly string[]
  readonly topicLessonIds: readonly string[]
}) {
  const t = useT(["topic"])
  const progress = useProgress()
  const next = continueLesson(progress, topicLessonIds)
  if (next !== undefined && lessonIds.includes(next)) {
    return (
      <Chip className="border-foreground bg-foreground text-background">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-background"
        />
        {t("topic.readingNow")}
      </Chip>
    )
  }
  if (summarize(progress, lessonIds).state === "done") {
    return (
      <Chip>
        <CheckIcon aria-hidden="true" />
        {t("topic.groupDone")}
      </Chip>
    )
  }
  return null
}
