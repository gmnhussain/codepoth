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
        <summary
          className={cn(
            SUMMARY_ROW,
            "min-h-18 gap-4 rounded-2xl px-5 py-4 hover:bg-muted/50"
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-4 border-track-dot bg-background font-mono text-sm"
          >
            {formatTwoDigits(track.number)}
          </span>
          <span className="flex flex-1 flex-col">
            <h2 id={`${anchor}-heading`} className="text-xl font-bold">
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
          {lessonIds.length > 0 ? <TrackRead lessonIds={lessonIds} /> : null}
          <ChevronDownIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground group-open/track:rotate-180"
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
