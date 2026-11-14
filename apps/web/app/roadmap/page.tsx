import type { Metadata } from "next"

import { t } from "@workspace/config/t"
import { getContentGraph } from "@workspace/content/content"
import { buildRoadmap } from "@workspace/content/roadmap"

import { LabelScope } from "@/components/label-scope"
import { RoadmapExplorer } from "@/components/roadmap/roadmap-explorer"
import { buildPageMetadata } from "@/lib/metadata"

function summaryOf(): string {
  const { stats } = getContentGraph()
  return t("roadmap.summary", { tracks: stats.tracks, topics: stats.topics })
}

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: t("nav.roadmap"),
    description: summaryOf(),
    path: "/roadmap",
  })
}

/**
 * Every track and topic as a metro-style map. Picking a topic opens its
 * panel; picking a track dims the rest. State lives in the URL
 * (?topic=&track=&q=&filter=), so a view can be shared.
 */
export default function RoadmapPage() {
  return (
    <LabelScope namespaces={["roadmap", "lesson", "topic"]}>
      <RoadmapExplorer
        roadmap={buildRoadmap(getContentGraph())}
        title={t("nav.roadmap")}
        summary={summaryOf()}
      />
    </LabelScope>
  )
}
