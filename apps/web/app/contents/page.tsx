import type { Metadata } from "next"

import { formatNumber } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { getContentGraph } from "@workspace/content/content"
import { trackAnchorOf } from "@workspace/content/routes"

import { ContentsControls } from "@/components/contents/contents-controls"
import { TrackSection } from "@/components/contents/track-section"
import { buildPageMetadata } from "@/lib/metadata"

const LIST_ID = "contents-list"

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: t("nav.contents"),
    description: t("contents.intro"),
    path: "/contents",
  })
}

/**
 * The whole curriculum on one page: tracks → topics → groups → lessons, in
 * reading order. The reader's progress (filters, done counts, "এখন পড়ছ")
 * arrives with reader progress.
 */
export default function ContentsPage() {
  const graph = getContentGraph()
  const stats = [
    { label: t("contents.statTracks"), value: graph.stats.tracks },
    { label: t("contents.statTopics"), value: graph.stats.topics },
    { label: t("contents.statLessons"), value: graph.stats.lessons },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-5xl font-bold">{t("nav.contents")}</h1>
          <p className="text-lg leading-reading text-foreground/80">
            {t("contents.intro")}
          </p>
        </div>
        <dl className="flex flex-wrap gap-7">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <dt className="text-sm font-semibold text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="font-heading text-3xl font-bold">
                {formatNumber(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <ContentsControls rootId={LIST_ID} />

      <div className="flex items-start gap-10">
        <nav
          aria-label={t("contents.jumpTo")}
          className="sticky top-6 hidden w-56 shrink-0 flex-col gap-0.5 lg:flex"
        >
          <p className="px-2.5 pb-1.5 text-sm font-semibold text-muted-foreground">
            {t("contents.jumpTo")}
          </p>
          {/* Plain in-page links, so `hashchange` fires and the target
              track opens (contents-controls.tsx). */}
          {graph.tracks.map((track) => (
            <a
              key={track.id}
              href={`#${trackAnchorOf(track.id)}`}
              data-track-color={track.color}
              className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground pointer-coarse:min-h-11"
            >
              <span
                aria-hidden="true"
                className="h-4.5 w-1.5 shrink-0 rounded-full bg-track-dot"
              />
              {track.titleEn}
            </a>
          ))}
        </nav>
        <div id={LIST_ID} className="flex min-w-0 flex-1 flex-col gap-3.5">
          {graph.tracks.map((track, index) => (
            <TrackSection
              key={track.id}
              graph={graph}
              track={track}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
