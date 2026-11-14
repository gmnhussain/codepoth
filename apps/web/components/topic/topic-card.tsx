import type { ContentGraph, GraphTopic } from "@workspace/content/graph"

import { TopicName } from "@/components/topic/topic-name"

/** A card for a related topic (prerequisite or next on the track), as a list item. */
export function TopicCard({
  graph,
  topic,
}: {
  readonly graph: ContentGraph
  readonly topic: GraphTopic
}) {
  const track = graph.tracks.find((item) => item.id === topic.track)
  return (
    <li
      data-track-color={track?.color}
      className="flex flex-col gap-1.5 rounded-2xl border bg-card p-5"
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden="true" className="size-2 rounded-full bg-track-dot" />
        {track?.titleEn}
      </span>
      <TopicName topic={topic} className="text-lg font-semibold" />
      <p className="text-sm leading-reading text-foreground/80">
        {topic.description}
      </p>
    </li>
  )
}
