import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { t } from "@workspace/config/t"
import { getContentGraph } from "@workspace/content/content"
import { isIndexableBuild } from "@workspace/content/env"
import { homeStartLesson } from "@workspace/content/home"
import { buildRoadmap } from "@workspace/content/roadmap"
import { buttonVariants } from "@workspace/ui/components/button"

import { DashboardView } from "@/components/dashboard/dashboard-view"
import { LastSavedChip } from "@/components/dashboard/last-saved-chip"
import { LabelScope } from "@/components/label-scope"
import { dashboardDataOf } from "@/lib/dashboard-data"
import { buildPageMetadata } from "@/lib/metadata"
import { isIndexableRoute } from "@/lib/routes"

const PATH = "/dashboard"

export function generateMetadata(): Metadata {
  return {
    ...buildPageMetadata({
      title: t("dashboard.title"),
      description: t("dashboard.subtitle"),
      path: PATH,
    }),
    // A personal page: never indexed, and left out of the sitemap. This
    // replaces the layout's robots, so keep its nofollow in builds that are
    // not indexable at all.
    ...(isIndexableRoute(PATH)
      ? {}
      : { robots: { index: false, follow: isIndexableBuild(process.env) } }),
  }
}

/**
 * The reader's dashboard (ADR-0014): overall progress, per-track bars, a map
 * of their topics, quiz results, bookmarks and a reading heatmap, read from
 * their progress in the browser. Nothing saved yet: the empty state, which
 * invites the first lesson. Export, import and clearing come next.
 */
export default function DashboardPage() {
  const graph = getContentGraph()
  const startLesson = homeStartLesson(graph)

  const emptyState = (
    <section
      aria-labelledby="empty-heading"
      className="flex flex-col items-center gap-5 rounded-2xl border bg-card px-8 py-16 text-center"
    >
      {/* A line of stations with only the first one reached. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 280 64"
        className="h-16 w-70 max-w-full"
      >
        <path
          d="M16 40 H96 L120 16 H264"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="fill-none stroke-border"
        />
        <circle
          data-track-color="indigo"
          cx={16}
          cy={40}
          r={10}
          strokeWidth={4}
          className="fill-card stroke-track-dot"
        />
        {[
          [72, 40],
          [160, 16],
          [212, 16],
          [264, 16],
        ].map(([cx, cy]) => (
          <circle
            key={`${String(cx)}-${String(cy)}`}
            cx={cx}
            cy={cy}
            r={8}
            strokeWidth={3.5}
            className="fill-card stroke-border"
          />
        ))}
      </svg>
      {/* Focusable: focus lands here after "সব মুছে ফেলো". */}
      <h2
        id="empty-heading"
        tabIndex={-1}
        className="text-3xl font-semibold outline-none"
      >
        {t("dashboard.emptyTitle")}
      </h2>
      <p className="max-w-xl text-lg leading-reading text-foreground/80">
        {t("dashboard.emptyText")}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {/* Until a lesson is published, the roadmap is the only way in. */}
        {startLesson === undefined ? null : (
          <Link
            href={startLesson.url}
            className={buttonVariants({ size: "lg" })}
          >
            {t("dashboard.firstLesson")}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        )}
        <Link
          href="/roadmap"
          className={buttonVariants({
            variant: startLesson === undefined ? "default" : "outline",
            size: "lg",
          })}
        >
          {t("home.roadmap")}
        </Link>
      </div>
    </section>
  )

  return (
    // Labels for the chip, the dashboard sections and their state words
    // (ADR-0013).
    <LabelScope namespaces={["dashboard", "status"]}>
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-12 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-4xl font-semibold sm:text-5xl">
              {t("dashboard.title")}
            </h1>
            <p className="text-lg text-foreground/80">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <LastSavedChip />
        </header>
        <DashboardView
          data={dashboardDataOf(graph, buildRoadmap(graph))}
          emptyState={emptyState}
        />
      </div>
    </LabelScope>
  )
}
