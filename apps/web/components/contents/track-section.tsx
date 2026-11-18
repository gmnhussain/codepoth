import { ChevronDownIcon } from "lucide-react"

import { formatTwoDigits } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import type {
  ContentGraph,
  GraphTopic,
  GraphTrack,
} from "@workspace/content/graph"
import { trackAnchorOf } from "@workspace/content/routes"
import { cn } from "@workspace/ui/lib/utils"

import { SUMMARY_ROW } from "@/components/contents/summary-class"
import { TopicItem } from "@/components/contents/topic-item"
import { TrackRead } from "@/components/contents/track-read"

/** A track on the contents page: a collapsible card of its topics in order. */
export function TrackSection({
  graph,
  track,
  defaultOpen,
}: {
  readonly graph: ContentGraph
  readonly track: GraphTrack
  readonly defaultOpen: boolean
}) {
  const anchor = trackAnchorOf(track.id)
  const ownTopics = track.topicKeys
    .map((key) => graph.topicByKey.get(key))
    .filter(
      (topic): topic is GraphTopic =>
        topic !== undefined && topic.track === track.id
    )
  const lessonIds = ownTopics.flatMap((topic) => topic.lessonIds)

  return (
    <section
      aria-labelledby={`${anchor}-heading`}
      data-filter-track=""
      data-track-color={track.color}
      className="relative rounded-2xl border bg-card"
    >
      <details open={defaultOpen} className="group/track">
        {/* A grid: below sm the read count sits under the subtitle, since
            badge, name, count and chevron in one row do not fit in 320px
            (the WCAG reflow width); from sm they share one row. */}
        <summary
          className={cn(
            SUMMARY_ROW,
            "grid min-h-18 grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 gap-y-2 rounded-2xl px-5 py-4 hover:bg-muted/50 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
          )}
        >
          <span
            aria-hidden="true"
            className="row-span-2 flex size-11 shrink-0 items-center justify-center rounded-full border-4 border-track-dot bg-background font-mono text-sm sm:row-span-1"
          >
            {formatTwoDigits(track.number)}
          </span>
          <span className="col-start-2 row-start-1 flex flex-col break-words">
            <h2 id={`${anchor}-heading`} className="text-xl font-semibold">
              {track.titleEn}
            </h2>
            <span className="text-sm text-muted-foreground">
              {track.title}
              <span aria-hidden="true"> · </span>
              {t("contents.trackMeta", {
                topics: ownTopics.length,
                n: lessonIds.length,
              })}
            </span>
          </span>
          {lessonIds.length > 0 ? (
            <TrackRead
              lessonIds={lessonIds}
              className="col-start-2 row-start-2 items-start sm:col-start-3 sm:row-start-1 sm:items-end"
            />
          ) : null}
          <ChevronDownIcon
            aria-hidden="true"
            className="col-start-3 row-start-1 size-5 shrink-0 text-muted-foreground group-open/track:rotate-180 sm:col-start-4"
          />
        </summary>
        {/* The #track-… target. It sits in the details' content, not the
            summary, so a browser that reveals hidden fragment targets
            ("ancestor details revealing") opens the track itself, even
            without JavaScript. Placed at the card's top, so the card lands
            where the scroll margin puts it. Browsers without that behaviour
            get the island's fallback (contents-controls.tsx). A cold load
            with JavaScript on still shifts: Chrome paints a frame scrolled to
            the still-closed track before parsing ends (performance.md). */}
        <span
          id={anchor}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 scroll-mt-24"
        />
        <div className="border-t px-5 pt-3 pb-4">
          <ol className="ms-2 flex flex-col gap-2 border-s-4 border-track-dot/50">
            {track.topicKeys.map((key, index) => {
              const topic = graph.topicByKey.get(key)
              return topic === undefined ? null : (
                <TopicItem
                  key={key}
                  graph={graph}
                  track={track}
                  topic={topic}
                  position={index + 1}
                />
              )
            })}
          </ol>
        </div>
      </details>
    </section>
  )
}
