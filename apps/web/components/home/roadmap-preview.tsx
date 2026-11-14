import type { Roadmap } from "@workspace/content/roadmap"
import { cn } from "@workspace/ui/lib/utils"

/** Dot radius in map units; interchanges are larger with a dark ring. */
const DOT_RADIUS = 9
const INTERCHANGE_RADIUS = 13

/**
 * The whole roadmap as a small SVG for Home's hero: track lines and a dot
 * per topic, scaled to its box. Decorative (the link around it is named).
 */
export function RoadmapPreview({ roadmap }: { readonly roadmap: Roadmap }) {
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
          className="fill-none stroke-track-dot"
        />
      ))}
      {roadmap.topics.map((topic) => (
        <circle
          key={topic.key}
          data-track-color={trackColor.get(topic.track)}
          cx={topic.x}
          cy={topic.y}
          r={topic.isInterchange ? INTERCHANGE_RADIUS : DOT_RADIUS}
          strokeWidth={topic.isInterchange ? 5 : 4.5}
          className={cn(
            "fill-card",
            topic.isInterchange ? "stroke-foreground" : "stroke-track-dot"
          )}
        />
      ))}
    </svg>
  )
}
