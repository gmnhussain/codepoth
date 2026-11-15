"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import { parseResumeIndex, resumeOf } from "@/lib/progress/resume"
import type { ResumeIndex } from "@/lib/progress/resume"
import { useProgress } from "@/lib/progress-store.client"

/** The prerendered lesson index (app/lessons.json/route.ts). */
const LESSON_INDEX_URL = "/lessons.json"

/** Grid-stacked text: both texts share one cell; only one is visible. */
const CELL = "col-start-1 row-start-1"

/**
 * The hero's main button and the line under it. A first visit (and the
 * prerendered HTML) shows "শুরু করো" and the first lesson; a returning
 * reader gets "চালিয়ে যাও" to the lesson and section they stopped at, and
 * "যেখানে থেমেছিলে: {lesson} · {group} গ্রুপের {t}টির {d}টি শেষ" (ADR-0014).
 *
 * The lesson index is fetched only when the reader has a last-read lesson,
 * after hydration, so first-time visitors never download it. A failed
 * request, an unexpected response or a lesson missing from it all keep the
 * first-visit view.
 *
 * No layout shift: both button texts share one grid cell, so its width is
 * fixed; the line is held at two lines tall and the resume text is clamped
 * to two, since its lesson title is not known on the server.
 */
export function HeroStart({
  startHref,
  firstVisitLine,
  children,
}: {
  readonly startHref: string
  readonly firstVisitLine: string
  /** The other hero buttons, after this one. */
  readonly children?: ReactNode
}) {
  const t = useT(["home"])
  const progress = useProgress()
  const hasLastRead = progress.lastRead !== undefined
  const [index, setIndex] = useState<ResumeIndex | undefined>(undefined)

  useEffect(() => {
    if (!hasLastRead) return
    const controller = new AbortController()
    fetch(LESSON_INDEX_URL, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((value: unknown) => {
        const parsed = parseResumeIndex(value)
        if (parsed !== undefined) setIndex(parsed)
      })
      .catch(() => {
        // Offline, aborted or not JSON: the first-visit view stays.
      })
    return () => {
      controller.abort()
    }
  }, [hasLastRead])

  const resume = index === undefined ? undefined : resumeOf(progress, index)
  const isResuming = resume !== undefined
  const resumeLine =
    resume === undefined
      ? ""
      : [
          t("home.resumeLine", { lesson: resume.title }),
          resume.scope.isGroup
            ? t("home.resumeGroup", {
                group: resume.scope.title,
                total: resume.scope.total,
                done: resume.scope.done,
              })
            : t("home.resumeTopic", {
                topic: resume.scope.title,
                total: resume.scope.total,
                done: resume.scope.done,
              }),
        ].join(" · ")

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Link
          href={resume?.href ?? startHref}
          className={buttonVariants({ size: "lg" })}
        >
          <span className="grid justify-items-center">
            <span className={cn(CELL, isResuming && "invisible")}>
              {t("home.start")}
            </span>
            <span className={cn(CELL, !isResuming && "invisible")}>
              {t("home.continue")}
            </span>
          </span>
          <ArrowRightIcon aria-hidden="true" />
        </Link>
        {children}
      </div>
      <p className="grid min-h-[2lh] text-sm text-muted-foreground">
        <span className={cn(CELL, isResuming && "invisible")}>
          {firstVisitLine}
        </span>
        <span className={cn(CELL, "line-clamp-2", !isResuming && "invisible")}>
          {resumeLine}
        </span>
      </p>
    </>
  )
}
