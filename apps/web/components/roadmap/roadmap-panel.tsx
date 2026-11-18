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
import { Progress, ProgressLabel } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import { Chip } from "@/components/chip"
import { LessonStateIcon } from "@/components/lesson/lesson-state-icon"
import { LessonRow } from "@/components/lesson-row"
import { ROADMAP_STATE_LABEL } from "@/components/roadmap/state-label"
import { StationDot } from "@/components/station-dot"
import { useT } from "@/lib/labels-context"
import { continueLesson, summarize } from "@/lib/progress/selectors"
import { useProgress } from "@/lib/progress-store.client"

/**
 * The selected topic: where it is, the reader's state and progress in it,
 * what it covers, how long it takes, a button that starts, continues or
 * rereads it, its lessons (each with its state), and its neighbours on the
 * home track. Shown beside the map from `md` and in a bottom sheet below it.
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
  const t = useT(["roadmap", "topic", "lesson", "status"])
  const trackOf = (id: string) => roadmap.tracks.find((item) => item.id === id)
  const topicOf = (key: string) =>
    roadmap.topics.find((item) => item.key === key)
  const home = trackOf(topic.track)
  const position = (home?.topicKeys.indexOf(topic.key) ?? -1) + 1
  const firstLesson = topic.groups[0]?.lessons[0] ?? topic.lessons[0]

  // The reader's progress in this topic, and the lesson the button opens.
  const progress = useProgress()
  const ordered = [
    ...topic.groups.flatMap((group) =>
      group.lessons.map((lesson) => ({ lesson, groupTitle: group.title }))
    ),
    ...topic.lessons.map((lesson) => ({ lesson, groupTitle: undefined })),
  ]
  const ids = ordered.map((item) => item.lesson.id)
  const { done, total, state } = summarize(progress, ids)
  const continueId = continueLesson(progress, ids)
  const resume = ordered.find((item) => item.lesson.id === continueId)
  const cta =
    state === "done"
      ? {
          label: t("roadmap.readAgain"),
          sub: t("roadmap.ctaAllDone"),
          url: firstLesson?.url,
        }
      : state === "in-progress" && resume !== undefined
        ? {
            label: t("topic.continue"),
            sub:
              resume.groupTitle === undefined
                ? t("roadmap.ctaNext", { lesson: resume.lesson.title })
                : t("roadmap.ctaNextGroup", {
                    lesson: resume.lesson.title,
                    group: resume.groupTitle,
                  }),
            url: resume.lesson.url,
          }
        : {
            label: t("topic.start"),
            sub:
              firstLesson === undefined
                ? ""
                : t("topic.firstLesson", { lesson: firstLesson.title }),
            url: firstLesson?.url,
          }
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
          className="text-3xl font-semibold outline-none"
        >
          {topic.title}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {topic.lessonCount > 0 ? (
            <Chip>
              <StationDot state={state} className="size-3 border-2" />
              {t(ROADMAP_STATE_LABEL[state])}
            </Chip>
          ) : null}
          {topic.isStart ? (
            <Chip className="border-foreground bg-foreground text-background">
              {t("roadmap.startForBeginners")}
            </Chip>
          ) : null}
          {topic.hasPage ? null : <Chip>{t("topic.planned")}</Chip>}
        </div>
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

      {topic.lessonCount > 0 ? (
        <Progress
          value={total === 0 ? 0 : Math.round((done / total) * 100)}
          getAriaValueText={() => t("roadmap.progress", { total, done })}
          className="gap-2 rounded-xl border px-3.5 py-3 [&_[data-slot=progress-indicator]]:bg-track-dot [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-1.5"
        >
          <ProgressLabel className="flex-1 text-sm font-semibold">
            {t("roadmap.yourProgress")}
          </ProgressLabel>
          <span
            aria-hidden="true"
            className="font-mono text-sm text-foreground/80"
          >
            {formatNumber(done)}/{formatNumber(total)}
          </span>
        </Progress>
      ) : null}

      {firstLesson === undefined || cta.url === undefined ? null : (
        <div className="flex flex-col gap-2">
          <Link
            href={cta.url}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-auto min-h-14 flex-col gap-0 py-1.5 leading-snug"
            )}
          >
            <span className="inline-flex items-center gap-2">
              {cta.label}
              <ArrowRightIcon aria-hidden="true" />
            </span>
            <span className="text-sm font-medium opacity-80">{cta.sub}</span>
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
                      leading={<LessonStateIcon lessonId={lesson.id} />}
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
                    leading={<LessonStateIcon lessonId={lesson.id} />}
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
