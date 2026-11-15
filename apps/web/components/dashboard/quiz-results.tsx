"use client"

import Link from "next/link"

import { formatDate, formatNumber } from "@workspace/config/format"
import { buttonVariants } from "@workspace/ui/components/button"

import { useT } from "@/lib/labels-context"
import { localDay } from "@/lib/progress/days"
import type { Progress } from "@/lib/progress/progress.schema"
import {
  averageQuizScore,
  quizResultsWeakestFirst,
} from "@/lib/progress/selectors"

/** How many of the weakest quizzes to list. */
const WEAKEST_SHOWN = 4

/**
 * "কুইজের ফলাফল": the average score, the questions answered, and the four
 * weakest quizzes, each with its score and a link back to the lesson's quiz.
 */
export function QuizResults({
  progress,
  lessons,
}: {
  readonly progress: Progress
  readonly lessons: Readonly<
    Record<
      string,
      { readonly title: string; readonly url: string; readonly path: string }
    >
  >
}) {
  const t = useT(["dashboard"])
  const results = quizResultsWeakestFirst(progress, Object.keys(lessons))
  const average = averageQuizScore(results)
  const answered = results.reduce((sum, result) => sum + result.total, 0)

  return (
    <section
      aria-labelledby="quiz-heading"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="quiz-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          {t("dashboard.quizResults")}
        </h2>
        {results.length > 0 ? (
          <p className="text-sm text-foreground/80">
            {t("dashboard.quizHint")}
          </p>
        ) : null}
      </div>
      {results.length === 0 || average === undefined ? (
        <p className="text-foreground/80">{t("dashboard.noQuiz")}</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <div className="flex flex-col-reverse rounded-xl border px-4 py-3">
              <dt className="text-sm text-muted-foreground">
                {t("dashboard.avgScore")}
              </dt>
              <dd className="font-heading text-2xl font-semibold">
                {t("dashboard.percent", { n: Math.round(average * 100) })}
              </dd>
            </div>
            <div className="flex flex-col-reverse rounded-xl border px-4 py-3">
              <dt className="text-sm text-muted-foreground">
                {t("dashboard.answered")}
              </dt>
              <dd className="font-heading text-2xl font-semibold">
                {formatNumber(answered)}
              </dd>
            </div>
          </dl>
          <h3 className="font-sans text-sm font-semibold text-muted-foreground">
            {t("dashboard.weakest")}
          </h3>
          <ul className="flex flex-col divide-y">
            {results.slice(0, WEAKEST_SHOWN).map((result) => {
              const lesson = lessons[result.id]
              if (lesson === undefined) return null
              const percent = Math.round((result.score / result.total) * 100)
              return (
                <li
                  key={result.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                >
                  <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
                    <span className="leading-snug font-medium">
                      {lesson.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {lesson.path}
                      <span aria-hidden="true"> · </span>
                      {formatDate(localDay(new Date(result.at)))}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-foreground/80">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-24 rounded-full bg-muted"
                      >
                        <span
                          className="block h-full rounded-full bg-warning"
                          // The share is data; its colour stays a token class.
                          style={{ width: `${String(percent)}%` }}
                        />
                      </span>
                      {t("dashboard.quizScore", {
                        total: result.total,
                        right: result.score,
                      })}
                    </span>
                  </div>
                  <Link
                    href={`${lesson.url}#quiz`}
                    aria-label={t("dashboard.retryLesson", {
                      lesson: lesson.title,
                    })}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    {t("dashboard.retry")}
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
