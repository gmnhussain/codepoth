import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, HardDriveIcon } from "lucide-react"

import { t } from "@workspace/config/t"
import { getContentGraph } from "@workspace/content/content"
import { homeStartLesson } from "@workspace/content/home"
import { buttonVariants } from "@workspace/ui/components/button"

import { Chip } from "@/components/chip"
import { buildPageMetadata } from "@/lib/metadata"

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: t("dashboard.title"),
    description: t("dashboard.subtitle"),
    path: "/dashboard",
  })
}

/**
 * The reader's dashboard in its first-visit state (D-32, D-40): nothing is
 * saved yet, so it invites the first lesson. Progress, quiz results,
 * bookmarks, the reading heatmap and export/import arrive with reader
 * progress (Phase 3).
 */
export default function DashboardPage() {
  const startLesson = homeStartLesson(getContentGraph())

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-bold sm:text-5xl">
            {t("dashboard.title")}
          </h1>
          <p className="text-lg text-foreground/80">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Chip>
          <HardDriveIcon aria-hidden="true" className="size-3.5" />
          {t("dashboard.nothingSaved")}
        </Chip>
      </header>

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
        <h2 id="empty-heading" className="text-3xl font-bold">
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
    </div>
  )
}
