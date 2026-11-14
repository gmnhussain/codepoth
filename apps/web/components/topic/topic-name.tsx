import Link from "next/link"

import { t } from "@workspace/config/t"
import type { GraphTopic } from "@workspace/content/graph"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A topic's name: a link to its page, or, for a planned topic with no
 * published lesson yet, plain text marked "পরিকল্পনায় আছে" (ADR-0009).
 */
export function TopicName({
  topic,
  className,
  isCurrent = false,
}: {
  readonly topic: GraphTopic
  readonly className?: string
  readonly isCurrent?: boolean
}) {
  if (!topic.hasPage) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {topic.title}
        <span className="ms-1.5 inline-block rounded-full border px-1.5 text-xs">
          {t("topic.planned")}
        </span>
      </span>
    )
  }
  return (
    <Link
      href={topic.url}
      className={cn("hover:underline hover:underline-offset-4", className)}
      {...(isCurrent ? { "aria-current": "page" as const } : {})}
    >
      {topic.title}
    </Link>
  )
}
