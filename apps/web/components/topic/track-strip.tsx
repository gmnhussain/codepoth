import { t } from "@workspace/config/t"
import type { ContentGraph, GraphTrack } from "@workspace/content/graph"
import { cn } from "@workspace/ui/lib/utils"

import { CenterCurrent } from "@/components/topic/center-current"
import { TopicName } from "@/components/topic/topic-name"
import { TopicStateDot } from "@/components/topic/topic-state-dot"

/**
 * The topic's track as a horizontal line of topics, the current one larger
 * and bold, each dot showing the reader's state (the roadmap's dot).
 * Scrolls sideways on narrow screens, starting with the current topic centred.
 */
export function TrackStrip({
  graph,
  track,
  currentKey,
}: {
  readonly graph: ContentGraph
  readonly track: GraphTrack
  readonly currentKey: string
}) {
  return (
    <nav
      aria-label={t("lesson.trackNav", { track: track.titleEn })}
      className="rounded-2xl border bg-card p-5"
    >
      <p className="mb-4 text-sm font-semibold">
        {track.titleEn}
        <span className="ms-2 font-normal text-muted-foreground">
          {track.title}
        </span>
      </p>
      <CenterCurrent className="overflow-x-auto">
        <ol className="flex min-w-max items-start">
          {track.topicKeys.map((key, index) => {
            const topic = graph.topicByKey.get(key)
            if (topic === undefined) return null
            const isCurrent = key === currentKey
            const isLast = index === track.topicKeys.length - 1
            return (
              <li
                key={key}
                {...(isCurrent ? { "data-current": "" } : {})}
                className="flex w-28 shrink-0 flex-col items-center gap-2 text-center"
              >
                <span
                  aria-hidden="true"
                  className="relative flex h-5 w-full items-center justify-center"
                >
                  {isLast ? null : (
                    <span className="absolute start-1/2 h-1 w-full bg-track-dot" />
                  )}
                  <TopicStateDot
                    lessonIds={topic.lessonIds}
                    className={cn(
                      "relative border-2",
                      isCurrent ? "size-5" : "size-3.5",
                      topic.isInterchange && "ring-2 ring-foreground"
                    )}
                  />
                </span>
                <TopicName
                  topic={topic}
                  isCurrent={isCurrent}
                  className={cn(
                    "flex min-h-11 flex-col items-center px-1 text-sm leading-snug",
                    isCurrent && "font-semibold"
                  )}
                />
              </li>
            )
          })}
        </ol>
      </CenterCurrent>
    </nav>
  )
}
