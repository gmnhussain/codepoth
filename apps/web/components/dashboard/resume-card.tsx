"use client"

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@workspace/ui/components/button"
import { Progress, ProgressLabel } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"
import type { Resume } from "@/lib/progress/resume"

/**
 * "শেষবার পড়েছ": the last-read lesson with its place, its group's (or
 * topic's) progress and "চালিয়ে যাও" to the saved section. The caller
 * renders it only when there is a resume (`resumeOf`).
 */
export function ResumeCard({
  resume,
  path,
}: {
  readonly resume: Resume
  /** "track · topic › group" of the lesson. */
  readonly path: string
}) {
  const t = useT(["dashboard"])
  const { title, isGroup, done, total } = resume.scope
  const scopeText = isGroup
    ? t("dashboard.resumeGroup", { group: title, total, done })
    : t("dashboard.resumeTopic", { topic: title, total, done })

  return (
    <section
      aria-labelledby="resume-heading"
      className="flex h-full flex-col gap-4 rounded-2xl border border-track/30 bg-track/5 p-6"
      data-track-color="indigo"
    >
      <h2
        id="resume-heading"
        className="text-sm font-semibold text-muted-foreground"
      >
        {t("dashboard.resumeTitle")}
      </h2>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground/80">{path}</span>
        <span className="font-heading text-2xl leading-snug font-semibold">
          {resume.title}
        </span>
      </div>
      <Progress
        value={total === 0 ? 0 : Math.round((done / total) * 100)}
        getAriaValueText={() => scopeText}
        className="flex-col gap-2 [&_[data-slot=progress-indicator]]:bg-track-dot [&_[data-slot=progress-indicator]]:motion-reduce:transition-none [&_[data-slot=progress-track]]:h-2"
      >
        <ProgressLabel className="text-sm font-normal text-foreground/80">
          {scopeText}
        </ProgressLabel>
      </Progress>
      <Link
        href={resume.href}
        className={cn(buttonVariants(), "mt-auto self-start")}
      >
        {t("dashboard.continue")}
        <ArrowRightIcon aria-hidden="true" />
      </Link>
    </section>
  )
}
