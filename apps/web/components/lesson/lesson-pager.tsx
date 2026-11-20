import { t } from "@workspace/config/t"
import type { ContentGraph } from "@workspace/content/graph"
import { neighboursOf } from "@workspace/content/graph"

import { PagerCard } from "@/components/lesson/pager-card"
import { PAGER_HEADING_ID } from "@/components/lesson/toc-items"

/**
 * The section after the blocks: the previous and next lesson along the lesson's home track
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
    // Other lessons' titles; not this lesson's words (ADR-0015).
    <section
      data-pagefind-ignore="all"
      aria-labelledby={PAGER_HEADING_ID}
      className="flex scroll-mt-24 flex-col gap-5"
    >
      <h2 id={PAGER_HEADING_ID} className="scroll-mt-24 text-3xl font-semibold">
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
