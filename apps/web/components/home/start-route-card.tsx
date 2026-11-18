import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { t } from "@workspace/config/t"
import type { ContentGraph } from "@workspace/content/graph"
import { firstTopicWithPage, startStepsOf } from "@workspace/content/home"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/** How many of the three level dots are filled for each card, in order. */
const LEVEL_DOTS = 3

type Route = ContentGraph["startRoutes"]["routes"][number]

/**
 * A "where to start" card from `content/start-routes.json`: level, title,
 * description, the suggested route, and a button to the first topic on it
 * that has a page (or the roadmap). Topics without a published lesson are
 * shown as planned, unlinked (ADR-0009).
 */
export function StartRouteCard({
  graph,
  route,
  index,
}: {
  readonly graph: ContentGraph
  readonly route: Route
  /** Position among the cards; fills the level dots (1, 2, 3). */
  readonly index: number
}) {
  const steps = startStepsOf(graph, route)
  const target = firstTopicWithPage(graph, route)
  const filled = Math.min(index + 1, LEVEL_DOTS)

  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          {route.level}
        </span>
        <span aria-hidden="true" className="inline-flex gap-1">
          {Array.from({ length: LEVEL_DOTS }, (_, dot) => (
            <span
              key={dot}
              className={cn(
                "size-2 rounded-full border-2 border-foreground",
                dot < filled && "bg-foreground"
              )}
            />
          ))}
        </span>
      </div>
      <h3 className="text-2xl font-semibold">{route.title}</h3>
      <p className="flex-1 leading-reading text-foreground/80">
        {route.description}
      </p>
      <ol
        aria-label={t("home.suggestedRoute")}
        className="flex flex-wrap items-center gap-y-2 rounded-xl border bg-background px-3.5 py-3"
      >
        {steps.map((step, position) => {
          const track =
            step.kind === "topic"
              ? graph.tracks.find((item) => item.id === step.topic.track)
              : undefined
          return (
            <li
              key={step.kind === "topic" ? step.topic.key : step.label}
              className="inline-flex items-center gap-1.5 text-sm font-medium"
            >
              {position === 0 ? null : (
                <span
                  aria-hidden="true"
                  className="mx-1.5 h-0.75 w-4.5 rounded-full bg-border"
                />
              )}
              <span
                aria-hidden="true"
                data-track-color={track?.color}
                className={cn(
                  "size-2.5 rounded-full border-2 bg-card",
                  track === undefined
                    ? "border-muted-foreground"
                    : "border-track-dot"
                )}
              />
              {step.kind === "label" ? (
                step.label
              ) : step.topic.hasPage ? (
                step.topic.title
              ) : (
                <span className="text-muted-foreground">
                  {step.topic.title}
                  <span className="sr-only">, {t("topic.planned")}</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <Link
        href={target?.url ?? "/roadmap"}
        className={cn(buttonVariants({ variant: "outline" }), "self-start")}
      >
        {target === undefined
          ? t("home.pickOnRoadmap")
          : t("home.startFrom", { topic: target.title })}
        <ArrowRightIcon aria-hidden="true" />
      </Link>
    </article>
  )
}
