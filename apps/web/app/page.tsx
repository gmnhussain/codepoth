import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRightIcon,
  BookmarkIcon,
  ListChecksIcon,
  MapIcon,
  MoonIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { formatNumber, formatTwoDigits } from "@workspace/config/format"
import type { LabelKey } from "@workspace/config/labels"
import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"
import { getContentGraph } from "@workspace/content/content"
import { homeStartLesson } from "@workspace/content/home"
import { buildRoadmap } from "@workspace/content/roadmap"
import { roadmapTrackUrl } from "@workspace/content/routes"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { Chip } from "@/components/chip"
import { AuthorCard } from "@/components/home/author-card"
import { RoadmapPreview } from "@/components/home/roadmap-preview"
import { StartRouteCard } from "@/components/home/start-route-card"
import { WhatsNew } from "@/components/home/whats-new"
import { buildPageMetadata } from "@/lib/metadata"

export function generateMetadata(): Metadata {
  return {
    ...buildPageMetadata({
      title: site.name.bn,
      description: t("site.tagline"),
      path: "/",
    }),
    // Home's title is the site name alone, without the "· কোডপথ" template.
    title: { absolute: site.name.bn },
  }
}

/** "কেন কোডপথ?" tiles: icon and label keys, in order. */
const WHY_TILES = [
  { icon: MapIcon, title: "home.whyMapTitle", text: "home.whyMapText" },
  {
    icon: ListChecksIcon,
    title: "home.whyQuizTitle",
    text: "home.whyQuizText",
  },
  {
    icon: TriangleAlertIcon,
    title: "home.whyMistakesTitle",
    text: "home.whyMistakesText",
  },
  { icon: SparklesIcon, title: "home.whyAiTitle", text: "home.whyAiText" },
  {
    icon: BookmarkIcon,
    title: "home.whyProgressTitle",
    text: "home.whyProgressText",
  },
  { icon: MoonIcon, title: "home.whyFastTitle", text: "home.whyFastText" },
] as const satisfies readonly {
  icon: unknown
  title: LabelKey
  text: LabelKey
}[]

const SECTION_TITLE = "text-3xl font-bold sm:text-4xl"

/**
 * Home: the pitch with a map preview and where to begin, site counts, the
 * start routes, every track, why the site exists, what's new and who writes
 * it. Every number is computed; the resume card arrives with reader progress.
 */
export default function HomePage() {
  const graph = getContentGraph()
  const roadmap = buildRoadmap(graph)
  const startLesson = homeStartLesson(graph)
  const startTopic =
    startLesson === undefined
      ? undefined
      : graph.topicByKey.get(startLesson.topicKey)
  const stats = [
    { label: t("home.statTracks"), value: graph.stats.tracks },
    { label: t("home.statTopics"), value: graph.stats.topics },
    { label: t("home.statLessons"), value: graph.stats.lessons },
    { label: t("home.statQuiz"), value: graph.stats.quizQuestions },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-22 px-4 pt-14 pb-22 sm:px-8">
      <section aria-labelledby="hero-heading" className="flex flex-col gap-9">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-col gap-6 lg:flex-5">
            <Chip className="self-start">
              <span
                aria-hidden="true"
                data-track-color="green"
                className="size-2 rounded-full bg-track-dot"
              />
              {t("home.heroChip")}
            </Chip>
            <h1
              id="hero-heading"
              className="text-4xl leading-tight font-bold sm:text-6xl"
            >
              {t("home.heroTitle")}
            </h1>
            <p className="max-w-xl text-lg leading-reading text-foreground/80">
              {t("home.heroText", { tracks: graph.stats.tracks })}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={startLesson?.url ?? "/roadmap"}
                className={buttonVariants({ size: "lg" })}
              >
                {t("home.start")}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
              <Link
                href="/roadmap"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                {t("home.roadmap")}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {startLesson === undefined || startTopic === undefined
                ? t("home.comingSoon")
                : t("home.firstLesson", {
                    topic: startTopic.title,
                    lesson: startLesson.title,
                    n: startLesson.readingMinutes,
                  })}
            </p>
          </div>
          <figure className="flex min-w-0 flex-col gap-3 lg:flex-6">
            <Link
              href="/roadmap"
              aria-label={t("home.openRoadmap")}
              className="block rounded-3xl border bg-card p-5 hover:border-foreground/30"
            >
              <RoadmapPreview roadmap={roadmap} />
            </Link>
            <figcaption className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
              <span>{t("home.mapCaption")}</span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-3.5 rounded-full border-3 border-foreground"
                />
                {t("home.interchangeCaption")}
              </span>
            </figcaption>
          </figure>
        </div>

        <dl
          aria-label={t("home.statsLabel", { site: site.name.bn })}
          className="grid grid-cols-2 overflow-hidden rounded-2xl border bg-card sm:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "flex min-w-0 flex-col-reverse gap-0.5 px-5.5 py-5",
                index > 0 && "sm:border-s",
                index % 2 === 1 && "border-s",
                index >= 2 && "border-t sm:border-t-0"
              )}
            >
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="font-heading text-3xl font-bold whitespace-nowrap">
                {t("home.statValue", { n: formatNumber(stat.value) })}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="start-heading" className="flex flex-col gap-7">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2 id="start-heading" className={SECTION_TITLE}>
            {t("home.whereStart")}
          </h2>
          <p className="text-lg text-foreground/80">
            {t("home.whereStartText")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {graph.startRoutes.routes.map((route, index) => (
            <StartRouteCard
              key={route.title}
              graph={graph}
              route={route}
              index={index}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="tracks-heading" className="flex flex-col gap-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-2xl flex-col gap-2">
            <h2 id="tracks-heading" className={SECTION_TITLE}>
              {t("roadmap.trackCount", { n: graph.tracks.length })}
            </h2>
            <p className="text-lg text-foreground/80">{t("home.tracksText")}</p>
          </div>
          <Link
            href="/roadmap"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("home.fullRoadmap")}
          </Link>
        </div>
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {graph.tracks.map((track) => {
            const lessonCount = track.topicKeys.reduce((sum, key) => {
              const topic = graph.topicByKey.get(key)
              return topic?.track === track.id
                ? sum + topic.lessonIds.length
                : sum
            }, 0)
            return (
              <li key={track.id} className="flex">
                <Link
                  href={roadmapTrackUrl(track.id)}
                  data-track-color={track.color}
                  className="group/track flex flex-1 flex-col gap-1 overflow-hidden rounded-2xl border bg-card px-4.5 pb-4 hover:border-foreground/30"
                >
                  <span
                    aria-hidden="true"
                    className="-mx-4.5 mb-3 block h-1.5 bg-track-dot"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {t("roadmap.trackNumber", {
                      n: formatTwoDigits(track.number),
                    })}
                  </span>
                  <h3 className="text-xl font-bold group-hover/track:underline group-hover/track:underline-offset-4">
                    {track.titleEn}
                  </h3>
                  <span className="flex-1 leading-snug text-foreground/80">
                    {track.title}
                  </span>
                  <span className="mt-1.5 flex gap-3.5 border-t pt-2.5 text-sm text-muted-foreground">
                    <span>
                      {t("home.topicCount", { n: track.topicKeys.length })}
                    </span>
                    <span>{t("topic.lessonCount", { n: lessonCount })}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="why-heading" className="flex flex-col gap-7">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2 id="why-heading" className={SECTION_TITLE}>
            {t("home.whyTitle", { site: site.name.bn })}
          </h2>
          <p className="text-lg text-foreground/80">{t("home.whyText")}</p>
        </div>
        <ul className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {WHY_TILES.map((tile) => (
            <li
              key={tile.title}
              className="flex flex-col gap-2.5 rounded-2xl border bg-card p-6"
            >
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-xl bg-muted"
              >
                <tile.icon className="size-5" />
              </span>
              <h3 className="text-xl font-semibold">{t(tile.title)}</h3>
              <p className="leading-relaxed text-foreground/80">
                {t(tile.text)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-7 lg:flex-row lg:items-stretch">
        <WhatsNew graph={graph} />
        <AuthorCard />
      </div>
    </div>
  )
}
