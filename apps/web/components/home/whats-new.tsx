import Link from "next/link"

import { formatDate } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { siteToday } from "@workspace/config/today"
import type { ContentGraph } from "@workspace/content/graph"
import { freshnessOf, recentLessons } from "@workspace/content/graph"

import { Chip } from "@/components/chip"

/** How many lessons "নতুন কী" lists (ADR-0009). */
const RECENT_COUNT = 5

/**
 * "নতুন কী" (`#new`, the footer's link): the lessons changed most recently,
 * with a "নতুন" or "হালনাগাদ" tag computed at build time (ADR-0009).
 */
export function WhatsNew({ graph }: { readonly graph: ContentGraph }) {
  const today = siteToday()
  const lessons = recentLessons(graph, RECENT_COUNT)

  return (
    <section
      id="new"
      aria-labelledby="new-heading"
      className="flex min-w-0 scroll-mt-24 flex-col gap-2.5 rounded-2xl border bg-card px-7 pt-7 pb-3.5 lg:flex-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="new-heading" className="text-2xl font-semibold">
          {t("footer.whatsNew")}
        </h2>
        <Link
          href="/contents"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-foreground/80 hover:text-foreground hover:underline hover:underline-offset-4"
        >
          {t("home.allLessons")}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      {lessons.length === 0 ? (
        <p className="pb-4 text-foreground/80">{t("home.nothingNew")}</p>
      ) : (
        <ol className="flex flex-col">
          {lessons.map((lesson) => {
            const track = graph.tracks.find((item) => item.id === lesson.track)
            const topic = graph.topicByKey.get(lesson.topicKey)
            const group =
              lesson.groupKey === undefined
                ? undefined
                : graph.groupByKey.get(lesson.groupKey)
            const changed =
              lesson.published !== undefined &&
              lesson.published > lesson.updated
                ? lesson.published
                : lesson.updated
            const freshness = freshnessOf(lesson, today)
            return (
              <li key={lesson.id} className="border-t first:border-t-0">
                <Link
                  href={lesson.url}
                  data-track-color={track?.color}
                  className="group/new flex min-h-14 items-center gap-3 rounded-lg py-2.5 hover:bg-muted/50"
                >
                  <span className="hidden shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground sm:block">
                    {formatDate(changed)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full bg-track-dot"
                  />
                  <span className="flex min-w-0 flex-1 flex-col leading-snug">
                    <span className="font-semibold group-hover/new:underline group-hover/new:underline-offset-4">
                      {lesson.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {/* Below sm the date moves here from its column. */}
                      <span className="sm:hidden">
                        {formatDate(changed)}
                        <span aria-hidden="true"> · </span>
                      </span>
                      {track?.titleEn}
                      <span aria-hidden="true"> · </span>
                      {topic?.title}
                      {group === undefined ? null : (
                        <>
                          <span aria-hidden="true"> › </span>
                          <span className="sr-only">, </span>
                          {group.title}
                        </>
                      )}
                    </span>
                  </span>
                  {freshness === undefined ? null : (
                    <Chip className="shrink-0 text-xs">
                      {freshness === "new"
                        ? t("home.newTag")
                        : t("home.updatedTag")}
                    </Chip>
                  )}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
