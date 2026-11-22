import type { ReactNode } from "react"
import Link from "next/link"
import { TargetIcon } from "lucide-react"

import {
  formatDate,
  formatNumber,
  formatTwoDigits,
} from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { GENERATED_SECTIONS } from "@workspace/content/blocks"
import type { ContentGraph, GraphLesson } from "@workspace/content/graph"
import {
  groupAnchorOf,
  roadmapTrackUrl,
  topicPositionOn,
} from "@workspace/content/routes"

import { Chip } from "@/components/chip"
import { LessonActions } from "@/components/lesson/lesson-actions"

/**
 * Breadcrumb, position chips, title, description, the updated/reading-time
 * line with the bookmark and "পাঠ শেষ" toggles, and the goals ("এই পাঠে
 * শিখবে").
 */
export function LessonHeader({
  graph,
  lesson,
  navTrigger,
}: {
  readonly graph: ContentGraph
  readonly lesson: GraphLesson
  /** The track-navigation drawer button, shown beside the breadcrumb below `lg`. */
  readonly navTrigger?: ReactNode
}) {
  const track = graph.tracks.find((item) => item.id === lesson.track)
  const topic = graph.topicByKey.get(lesson.topicKey)
  const group =
    lesson.groupKey === undefined
      ? undefined
      : graph.groupByKey.get(lesson.groupKey)
  const topicPosition =
    topic === undefined
      ? undefined
      : topicPositionOn(graph, lesson.track, topic)

  // The track opens the roadmap focused on it; topic and group link to the
  // topic page.
  const crumbs: readonly { label: string; href?: string }[] = [
    { label: t("nav.roadmap"), href: "/roadmap" },
    ...(track === undefined
      ? []
      : [{ label: track.titleEn, href: roadmapTrackUrl(track.id) }]),
    ...(topic === undefined ? [] : [{ label: topic.title, href: topic.url }]),
    ...(topic === undefined || group === undefined
      ? []
      : [
          {
            label: group.title,
            href: `${topic.url}#${groupAnchorOf(group.slug)}`,
          },
        ]),
  ]

  return (
    // Only the title, description and goals are this lesson's words for the
    // search index; the rest is left out (ADR-0015, ADR-0018).
    <header className="flex flex-col gap-5">
      <div
        data-pagefind-ignore="all"
        className="flex items-start justify-between gap-3"
      >
        <nav aria-label={t("lesson.breadcrumb")} className="min-w-0">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {crumbs.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-2">
                {crumb.href === undefined ? (
                  <span>{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="underline decoration-foreground/30 underline-offset-4 hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
                <span aria-hidden="true">/</span>
              </li>
            ))}
            <li aria-current="page" className="text-foreground">
              {lesson.title}
            </li>
          </ol>
        </nav>
        {navTrigger}
      </div>

      {/* One line that scrolls sideways below sm, so its height never
          depends on the font: wrapped to two lines with the fallback font
          and one with the web font, the swap moved the whole page up on
          slow connections (performance.md). A named, focusable region, so
          the keyboard can scroll it. */}
      <div
        data-pagefind-ignore="all"
        role="region"
        aria-label={t("lesson.chipsLabel")}
        tabIndex={0}
        className="flex gap-2 overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-ring sm:flex-wrap"
      >
        {track === undefined ? null : (
          <Chip>
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-track-dot"
            />
            {t("lesson.trackChip", {
              track: track.titleEn,
              n: formatTwoDigits(track.number),
            })}
          </Chip>
        )}
        {topicPosition === undefined ? null : (
          <Chip>{t("lesson.topicChip", { pos: topicPosition })}</Chip>
        )}
        {group === undefined || lesson.numberInGroup === undefined ? (
          <Chip>{t("lesson.lessonChip", { pos: lesson.numberInTopic })}</Chip>
        ) : (
          <Chip>
            {t("lesson.groupChip", {
              group: group.title,
              pos: lesson.numberInGroup,
            })}
          </Chip>
        )}
      </div>

      <h1 className="text-4xl font-semibold sm:text-5xl">{lesson.title}</h1>
      {lesson.description === undefined ? null : (
        <p className="text-lg leading-reading text-foreground/80">
          {lesson.description}
        </p>
      )}
      <div
        data-pagefind-ignore="all"
        className="flex flex-wrap items-start justify-between gap-3 border-t pt-4"
      >
        <p className="py-1.5 text-sm text-muted-foreground">
          {t("lesson.updated", { date: formatDate(lesson.updated) })}
          <span aria-hidden="true"> · </span>
          {t("lesson.readingTime", { n: formatNumber(lesson.readingMinutes) })}
        </p>
        <LessonActions lessonId={lesson.id} />
      </div>
      {lesson.goals === undefined ? null : (
        // The goals are the lesson's own words and stay searchable; the
        // label does not (ADR-0018). A framed card, unlike the tinted
        // Summary card, so the two ends of the lesson are told apart; dots,
        // not ticks, because a tick means "done" on this site.
        <section
          aria-labelledby={GENERATED_SECTIONS.goals}
          className="flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:px-6"
        >
          <h2
            id={GENERATED_SECTIONS.goals}
            data-pagefind-ignore="all"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <TargetIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-track-dot"
            />
            {t("lesson.goals")}
          </h2>
          <ul className="flex list-disc flex-col gap-1.5 ps-6 leading-reading marker:text-track-dot">
            {lesson.goals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </section>
      )}
    </header>
  )
}
