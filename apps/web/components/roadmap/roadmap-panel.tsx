"use client"

import type { Ref } from "react"
import Link from "next/link"
import { ArrowRightIcon, ChevronRightIcon, XIcon } from "lucide-react"

import {
  formatList,
  formatNumber,
  formatTwoDigits,
} from "@workspace/config/format"
import { roundedDuration } from "@workspace/content/reading-time"
import type { Roadmap, RoadmapTopic } from "@workspace/content/roadmap"
import { topicNeighbours } from "@workspace/content/roadmap"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { Chip } from "@/components/chip"
import { LessonRow } from "@/components/lesson-row"
import { useT } from "@/lib/labels-context"

/**
 * The selected topic: where it is, what it covers, how long it takes, where
 * to start, its lessons, and its neighbours on the home track. Shown beside
 * the map from `md` and in a bottom sheet below it.
 */
export function RoadmapPanel({
  roadmap,
  topic,
  onSelect,
  onClose,
  headingRef,
}: {
  readonly roadmap: Roadmap
  readonly topic: RoadmapTopic
  readonly onSelect: (key: string) => void
  /** Only beside the map; the sheet has its own close button. */
  readonly onClose?: (() => void) | undefined
  readonly headingRef?: Ref<HTMLHeadingElement> | undefined
}) {
  const t = useT(["roadmap", "topic", "lesson"])
  const trackOf = (id: string) => roadmap.tracks.find((item) => item.id === id)
  const topicOf = (key: string) =>
    roadmap.topics.find((item) => item.key === key)
  const home = trackOf(topic.track)
  const position = (home?.topicKeys.indexOf(topic.key) ?? -1) + 1
  const firstLesson = topic.groups[0]?.lessons[0] ?? topic.lessons[0]
  const otherTracks = topic.trackIds
    .filter((id) => id !== topic.track)
    .map((id) => trackOf(id)?.titleEn)
    .filter((name): name is string => name !== undefined)
  const { previous, next } = topicNeighbours(roadmap, topic.track, topic.key)
  const duration = roundedDuration(topic.readingMinutes)

  return (
    <div data-track-color={home?.color} className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {topic.trackIds.map((id) => {
            const track = trackOf(id)
            return track === undefined ? null : (
              <Chip key={id}>
                <span
                  aria-hidden="true"
                  data-track-color={track.color}
                  className="size-2 rounded-full bg-track-dot"
                />
                {track.titleEn}
              </Chip>
            )
          })}
        </div>
        {onClose === undefined ? null : (
          <Button variant="outline" size="icon" onClick={onClose}>
            <XIcon aria-hidden="true" />
            <span className="sr-only">{t("roadmap.closePanel")}</span>
          </Button>
        )}
      </div>
      <div aria-hidden="true" className="h-1.5 rounded-full bg-track-dot" />

      <div className="flex flex-col gap-2">
        {home === undefined || position === 0 ? null : (
          <p className="text-sm font-semibold text-muted-foreground">
            {t("roadmap.kicker", {
              n: formatTwoDigits(home.number),
              pos: `${formatNumber(position)}/${formatNumber(home.topicKeys.length)}`,
            })}
          </p>
        )}
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold outline-none"
        >
          {topic.title}
        </h2>
        {topic.isStart || !topic.hasPage ? (
          <div className="flex flex-wrap gap-1.5">
            {topic.isStart ? (
              <Chip className="border-foreground bg-foreground text-background">
                {t("roadmap.startForBeginners")}
              </Chip>
            ) : null}
            {topic.hasPage ? null : <Chip>{t("topic.planned")}</Chip>}
          </div>
        ) : null}
      </div>
      <p className="leading-reading text-foreground/80">{topic.description}</p>

      {topic.lessonCount > 0 ? (
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border px-3 py-2.5">
            <dt className="text-xs font-semibold text-muted-foreground">
              {t("roadmap.lessonsLabel")}
            </dt>
            <dd className="font-heading text-xl font-semibold">
              {t("roadmap.lessonCountValue", { n: topic.lessonCount })}
            </dd>
          </div>
          <div className="rounded-xl border px-3 py-2.5">
            <dt className="text-xs font-semibold text-muted-foreground">
              {t("roadmap.readTimeLabel")}
            </dt>
            <dd className="font-heading text-xl font-semibold">
              {duration.unit === "hours"
                ? t("roadmap.timeHours", { n: duration.value })
                : t("roadmap.timeMinutes", { n: duration.value })}
            </dd>
          </div>
        </dl>
      ) : null}

      {firstLesson === undefined ? null : (
        <div className="flex flex-col gap-2">
          <Link
            href={firstLesson.url}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-auto min-h-14 flex-col gap-0 py-1.5 leading-snug"
            )}
          >
            <span className="inline-flex items-center gap-2">
              {t("topic.start")}
              <ArrowRightIcon aria-hidden="true" />
            </span>
            <span className="text-sm font-medium opacity-80">
              {t("topic.firstLesson", { lesson: firstLesson.title })}
            </span>
          </Link>
          {topic.hasPage ? (
            <Link
              href={topic.url}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("roadmap.topicPage")}
            </Link>
          ) : null}
        </div>
      )}

      {topic.lessonCount > 0 ? (
        <section
          aria-labelledby="panel-lessons"
          className="flex flex-col gap-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3
              id="panel-lessons"
              className="font-sans text-sm font-semibold text-muted-foreground"
            >
              {t("roadmap.lessonsHeading")}
            </h3>
            <span className="text-xs text-muted-foreground">
              {topic.groups.length > 0
                ? t("topic.groupCount", { n: topic.groups.length })
                : t("roadmap.noGroups")}
            </span>
          </div>
          {topic.groups.map((group, index) => (
            <details
              key={group.key}
              open={index === 0}
              className="group/lessons rounded-xl border"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 hover:bg-muted [&::-webkit-details-marker]:hidden">
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground group-open/lessons:rotate-90"
                />
                <span className="flex-1 font-heading font-semibold">
                  {group.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("topic.lessonCount", { n: group.lessons.length })}
                </span>
              </summary>
              <ol className="px-1 pb-1.5">
                {group.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id}>
                    <LessonRow
                      t={t}
                      lesson={lesson}
                      number={formatNumber(lessonIndex + 1)}
                      className="min-h-11 gap-3 rounded-lg px-2.5 py-1.5"
                      numberClassName="w-4 text-end text-xs"
                    />
                  </li>
                ))}
              </ol>
            </details>
          ))}
          {topic.lessons.length > 0 ? (
            <ol className="rounded-xl border p-1">
              {topic.lessons.map((lesson, lessonIndex) => (
                <li key={lesson.id}>
                  <LessonRow
                    t={t}
                    lesson={lesson}
                    number={formatNumber(lessonIndex + 1)}
                    className="min-h-11 gap-3 rounded-lg px-2.5 py-1.5"
                    numberClassName="w-4 text-end text-xs"
                  />
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      {otherTracks.length > 0 ? (
        <p className="rounded-xl bg-muted px-3.5 py-2.5 text-sm text-foreground/80">
          {t("roadmap.interchangeNote", { tracks: formatList(otherTracks) })}
        </p>
      ) : null}

      {home === undefined ? null : (
        <nav aria-labelledby="panel-track" className="flex flex-col gap-1.5">
          <h3
            id="panel-track"
            className="font-sans text-sm font-semibold text-muted-foreground"
          >
            {t("lesson.trackNav", { track: home.titleEn })}
          </h3>
          <ol className="ms-2 flex flex-col border-s-4 border-track-dot">
            {home.topicKeys.map((key) => {
              const item = topicOf(key)
              if (item === undefined) return null
              const isCurrent = key === topic.key
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => {
                      onSelect(key)
                    }}
                    className="flex min-h-11 w-full cursor-pointer items-center rounded-e-lg ps-4 pe-2 text-start hover:bg-muted aria-[current=step]:bg-muted aria-[current=step]:font-semibold"
                  >
                    {item.title}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      <div
        role="group"
        aria-label={t("roadmap.neighbours")}
        className="grid grid-cols-2 gap-2"
      >
        {[
          { key: previous, label: t("roadmap.previousTopic"), arrow: "←" },
          { key: next, label: t("roadmap.nextTopic"), arrow: "→" },
        ].map((item, index) => {
          const target = item.key === undefined ? undefined : topicOf(item.key)
          return target === undefined ? (
            <span key={index} />
          ) : (
            <Button
              key={index}
              variant="outline"
              onClick={() => {
                onSelect(target.key)
              }}
              className={cn("h-auto min-h-11", index === 1 && "col-start-2")}
            >
              {index === 0 ? (
                <span aria-hidden="true">{item.arrow}</span>
              ) : null}
              <span className="sr-only">{item.label} </span>
              <span className="truncate">{target.title}</span>
              {index === 1 ? (
                <span aria-hidden="true">{item.arrow}</span>
              ) : null}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
