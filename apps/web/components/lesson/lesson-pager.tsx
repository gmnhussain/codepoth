import { formatTwoDigits } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { NEXT_SECTION_NUMBER } from "@workspace/content/blocks"
import type { ContentGraph } from "@workspace/content/graph"
import { neighboursOf } from "@workspace/content/graph"

import { PagerCard } from "@/components/lesson/pager-card"
import { PAGER_HEADING_ID } from "@/components/lesson/toc-items"

/**
 * Section ০৭: the previous and next lesson along the lesson's home track
 * (computed at build time, `neighboursOf`), noting a new group or topic.
 */
export function LessonPager({
  graph,
  lessonId,
}: {
  readonly graph: ContentGraph
  readonly lessonId: string
}) {
  const { previous, next } = neighboursOf(graph, lessonId)
  if (previous === undefined && next === undefined) return null
  return (
    <section
      aria-labelledby={PAGER_HEADING_ID}
      className="flex scroll-mt-24 flex-col gap-5"
    >
      <h2
        id={PAGER_HEADING_ID}
        className="flex scroll-mt-24 items-center gap-3 text-3xl font-semibold"
      >
        <span
          aria-hidden="true"
          className="rounded-md border border-input px-2 font-mono text-sm font-medium text-muted-foreground"
        >
          {formatTwoDigits(NEXT_SECTION_NUMBER)}
        </span>
        {t("blocks.next")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {previous === undefined ? null : (
          <PagerCard graph={graph} neighbour={previous} direction="prev" />
        )}
        {next === undefined ? null : (
          <PagerCard graph={graph} neighbour={next} direction="next" />
        )}
      </div>
    </section>
  )
}
