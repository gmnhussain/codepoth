import type { CSSProperties } from "react"
import { FlagIcon } from "lucide-react"

import { t } from "@workspace/config/t"
import type { Roadmap, RoadmapTopic } from "@workspace/content/roadmap"
import { cn } from "@workspace/ui/lib/utils"

/** Gap between a dot and its label, in map units; interchanges are larger. */
const LABEL_GAP = 18
const INTERCHANGE_EXTRA = 4
/** How far above its dot a "শুরু এখান থেকে" flag sits. */
const FLAG_OFFSET = 50
/** A topic's hit area on screen, whatever the zoom. */
const TARGET_PX = 44

/**
 * Where a label sits from `map.json`'s `label` (top, bottom, left, right,
 * top-right). Geometry comes from data, so it is an inline position; the
 * look stays in classes.
 */
function labelPlacement(topic: RoadmapTopic): {
  style: CSSProperties
  className: string
} {
  const extra = topic.isInterchange ? INTERCHANGE_EXTRA : 0
  const { x, y } = topic
  switch (topic.label) {
    case "top":
      return {
        style: { left: x, top: y - 2 * LABEL_GAP - extra },
        className: "-translate-x-1/2",
      }
    case "bottom":
      return {
        style: { left: x, top: y + LABEL_GAP - 4 + extra },
        className: "-translate-x-1/2",
      }
    case "left":
      return {
        style: { left: x - LABEL_GAP - extra, top: y - 11 },
        className: "-translate-x-full",
      }
    case "top-right":
      return { style: { left: x + 16, top: y - 38 }, className: "" }
    case "right":
      return {
        style: { left: x + LABEL_GAP + extra, top: y - 11 },
        className: "",
      }
  }
}

/**
 * The roadmap drawing: track lines, topic labels, start flags and a 44px
 * button per topic. Presentational and hook-free, so a server page can
 * render it as a static preview (no `onSelect`: no buttons).
 */
export function RoadmapCanvas({
  roadmap,
  scale,
  isVisible,
  selectedKey,
  focusedTrack,
  onSelect,
}: {
  readonly roadmap: Roadmap
  readonly scale: number
  readonly isVisible: (topic: RoadmapTopic) => boolean
  readonly selectedKey?: string | undefined
  readonly focusedTrack?: string | undefined
  readonly onSelect?: ((key: string) => void) | undefined
}) {
  const trackById = new Map(roadmap.tracks.map((track) => [track.id, track]))
  const dim = "opacity-15"
  const fade = "motion-safe:transition-opacity"

  return (
    <div
      role={onSelect === undefined ? undefined : "group"}
      aria-label={onSelect === undefined ? undefined : t("roadmap.mapLabel")}
      aria-hidden={onSelect === undefined ? true : undefined}
      className="relative origin-top-left"
      style={{
        width: roadmap.width,
        height: roadmap.height,
        transform: `scale(${String(scale)})`,
      }}
    >
      <svg
        aria-hidden="true"
        width={roadmap.width}
        height={roadmap.height}
        viewBox={`0 0 ${String(roadmap.width)} ${String(roadmap.height)}`}
        className="absolute inset-0 overflow-visible"
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
              fade,
              focusedTrack !== undefined && focusedTrack !== track.id && dim
            )}
          />
        ))}
      </svg>

      {roadmap.topics.map((topic) => {
        const placement = labelPlacement(topic)
        return (
          <span
            key={topic.key}
            aria-hidden="true"
            style={placement.style}
            className={cn(
              "absolute rounded-md bg-background px-1.5 text-sm leading-snug font-semibold whitespace-nowrap",
              !topic.hasPage && "font-medium text-muted-foreground",
              placement.className,
              fade,
              !isVisible(topic) && dim
            )}
          >
            {topic.title}
          </span>
        )
      })}

      {roadmap.topics
        .filter((topic) => topic.isStart)
        .map((topic) => (
          <span
            key={topic.key}
            aria-hidden="true"
            style={{ left: topic.x, top: topic.y - FLAG_OFFSET }}
            className={cn(
              "absolute inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground py-0.5 ps-2 pe-2.5 text-xs leading-normal font-semibold whitespace-nowrap text-background",
              fade,
              !isVisible(topic) && dim
            )}
          >
            <FlagIcon className="size-3" />
            {t("roadmap.startHere")}
          </span>
        ))}

      {roadmap.topics.map((topic) => {
        const track = trackById.get(topic.track)
        const isSelected = topic.key === selectedKey
        const dot = (
          <span
            className={cn(
              "rounded-full border-4 border-track-dot bg-background motion-safe:transition-transform",
              topic.isInterchange ? "size-6.5 border-foreground" : "size-4.5",
              onSelect !== undefined && "group-hover/station:scale-110",
              isSelected && "outline-2 outline-offset-4 outline-foreground"
            )}
          />
        )
        // The hit area counter-scales with the zoom, so it stays 44px on
        // screen at every zoom level (design.md#accessibility).
        const target = TARGET_PX / scale
        const position = {
          left: topic.x,
          top: topic.y,
          width: target,
          height: target,
          marginInlineStart: -target / 2,
          marginTop: -target / 2,
        }
        const className = cn(
          "absolute flex items-center justify-center rounded-full",
          fade,
          !isVisible(topic) && dim
        )
        if (onSelect === undefined || track === undefined) {
          return (
            <span
              key={topic.key}
              data-track-color={track?.color}
              style={position}
              className={className}
            >
              {dot}
            </span>
          )
        }
        const name = [
          t("roadmap.topicButton", {
            topic: topic.title,
            track: track.titleEn,
          }),
          topic.isStart ? t("roadmap.startHere") : undefined,
          topic.hasPage ? undefined : t("topic.planned"),
        ]
          .filter((part): part is string => part !== undefined)
          .join(", ")
        return (
          <button
            key={topic.key}
            type="button"
            data-track-color={track.color}
            data-topic={topic.key}
            aria-label={name}
            aria-pressed={isSelected}
            onClick={() => {
              onSelect(topic.key)
            }}
            style={position}
            className={cn(
              className,
              "group/station cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            )}
          >
            {dot}
          </button>
        )
      })}
    </div>
  )
}
