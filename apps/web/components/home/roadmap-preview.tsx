import type { RoadmapTopic, RoadmapTrack } from "@workspace/content/roadmap"
import { cn } from "@workspace/ui/lib/utils"

import type { LessonState } from "@/lib/progress/selectors"

/** Dot radius in map units; interchanges are larger with a dark ring. */
const DOT_RADIUS = 9
const INTERCHANGE_RADIUS = 13
/** The centre dot of a topic in progress. */
const INNER_RADIUS = 4

/** Only what the preview draws, so a client island can get it small. */
export type MapPreviewData = {
  readonly width: number
  readonly height: number
  readonly tracks: readonly Pick<RoadmapTrack, "id" | "color" | "points">[]
  readonly topics: readonly Pick<
    RoadmapTopic,
    "key" | "x" | "y" | "track" | "isInterchange"
  >[]
}

/**
 * The whole roadmap as a small SVG, scaled to its box: track lines and a dot
 * per topic. Decorative (the link around it is named). Home's hero shows it
 * plain. With `stateOf` (the Dashboard's "আমার ম্যাপ") the lines fade and
 * each dot shows the reader's state like the roadmap's `StationDot`:
 * filled when done, a centre dot while in progress, a faded ring before.
 */
export function RoadmapPreview({
  roadmap,
  stateOf,
}: {
  readonly roadmap: MapPreviewData
  readonly stateOf?: ((topicKey: string) => LessonState) | undefined
}) {
  const trackColor = new Map(
    roadmap.tracks.map((track) => [track.id, track.color])
  )
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${String(roadmap.width)} ${String(roadmap.height)}`}
      className="block h-auto w-full"
    >
      {roadmap.tracks.map((track) => (
        <polyline
          key={track.id}
          data-track-color={track.color}
          points={track.points}
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "fill-none stroke-track-dot",
            stateOf !== undefined && "opacity-30"
          )}
        />
      ))}
      {roadmap.topics.map((topic) => {
        const state = stateOf?.(topic.key)
        return (
          <g
            key={topic.key}
            data-track-color={trackColor.get(topic.track)}
            className={cn(state === "not-started" && "opacity-40")}
          >
            <circle
              cx={topic.x}
              cy={topic.y}
              r={topic.isInterchange ? INTERCHANGE_RADIUS : DOT_RADIUS}
              strokeWidth={topic.isInterchange ? 5 : 4.5}
              className={cn(
                state === "done" ? "fill-track-dot" : "fill-card",
                topic.isInterchange ? "stroke-foreground" : "stroke-track-dot"
              )}
            />
            {state === "in-progress" ? (
              <circle
                cx={topic.x}
                cy={topic.y}
                r={INNER_RADIUS}
                className="fill-track-dot"
              />
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
