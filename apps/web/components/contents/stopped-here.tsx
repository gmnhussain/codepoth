"use client"

import { Chip } from "@/components/chip"
import { useT } from "@/lib/labels-context"
import { useProgress } from "@/lib/progress-store.client"

/**
 * "এখানে থেমেছিলে" on the lesson the reader read last. Part of the row
 * link's name; below `sm` it is only read, not shown, so it never squeezes
 * a title on a narrow screen.
 */
export function StoppedHere({ lessonId }: { readonly lessonId: string }) {
  const t = useT(["contents"])
  if (useProgress().lastRead?.id !== lessonId) return null
  return (
    <Chip className="h-6 shrink-0 text-xs max-sm:sr-only">
      {t("contents.stoppedHere")}
    </Chip>
  )
}
