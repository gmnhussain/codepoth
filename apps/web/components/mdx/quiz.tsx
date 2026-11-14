"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { CheckIcon, XIcon } from "lucide-react"

import { formatNumber } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/** One question as the lesson frontmatter defines it (ADR-0009). */
export type QuizQuestion = {
  readonly question: string
  readonly code?: string | undefined
  readonly options: readonly string[]
  readonly answer: number
  readonly explanation: string
}

/**
 * Shows `backtick` spans in quiz text as inline code. Frontmatter text is
 * plain, so this is the one bit of markup the quiz understands
 * (docs/content-model.md#lesson-frontmatter).
 */
function withInlineCode(text: string): ReactNode[] {
  return text.split("`").map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className="rounded-md bg-muted px-1.5 py-0.5 font-mono">
        {part}
      </code>
    ) : (
      part
    )
  )
}

/**
 * The interactive part of the quiz block: one answer per question, locked
 * once chosen, with ✓/✗ and the explanation, a score when every question is
 * answered, and "আবার চেষ্টা করো". Options are buttons, so arrow keys never
 * answer by accident: Tab moves between them, Enter or Space answers.
 * Saving the score is reader progress (Phase 3); here the state lives only
 * in the page.
 */
export function QuizQuestions({
  questions,
}: {
  readonly questions: readonly QuizQuestion[]
}) {
  const [answers, setAnswers] = useState<ReadonlyMap<number, number>>(
    () => new Map()
  )
  const keys = t("quiz.optionKeys").split(" ")
  const right = questions.filter(
    (question, index) => answers.get(index) === question.answer
  ).length
  const isFinished = answers.size === questions.length

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col gap-6">
        {questions.map((question, index) => {
          const chosen = answers.get(index)
          const isAnswered = chosen !== undefined
          const isRight = chosen === question.answer
          return (
            <li key={index} className="rounded-2xl border bg-card p-5 sm:p-6">
              <fieldset className="flex flex-col gap-4">
                <legend className="flex flex-col gap-1">
                  <span className="font-mono text-sm text-muted-foreground">
                    {t("quiz.question", { n: index + 1 })}
                  </span>
                  <span className="text-lg leading-snug font-semibold">
                    {withInlineCode(question.question)}
                  </span>
                </legend>
                {question.code === undefined ? null : (
                  <pre className="overflow-x-auto rounded-xl bg-code p-4 font-mono text-sm text-code-foreground">
                    <code>{question.code}</code>
                  </pre>
                )}
                <div className="flex flex-col gap-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrectOption = optionIndex === question.answer
                    const isChosen = optionIndex === chosen
                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        // aria-disabled, not disabled: the answered button keeps
                        // focus and stays readable for screen readers.
                        aria-disabled={isAnswered}
                        aria-pressed={isChosen}
                        onClick={() => {
                          if (isAnswered) return
                          setAnswers((current) =>
                            new Map(current).set(index, optionIndex)
                          )
                        }}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-start focus-visible:outline-2 focus-visible:outline-ring",
                          !isAnswered && "hover:bg-muted",
                          isAnswered && "cursor-default",
                          isAnswered &&
                            isCorrectOption &&
                            "border-success bg-success/10",
                          isAnswered &&
                            isChosen &&
                            !isCorrectOption &&
                            "border-destructive bg-destructive/10"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="flex size-7 shrink-0 items-center justify-center rounded-full border font-medium"
                        >
                          {keys[optionIndex] ?? formatNumber(optionIndex + 1)}
                        </span>
                        <span className="flex-1 leading-reading">
                          {withInlineCode(option)}
                        </span>
                        {isAnswered && isCorrectOption ? (
                          <CheckIcon
                            aria-hidden="true"
                            className="size-5 text-success"
                          />
                        ) : null}
                        {isAnswered && isChosen && !isCorrectOption ? (
                          <XIcon
                            aria-hidden="true"
                            className="size-5 text-destructive"
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
                <div role="status" aria-live="polite">
                  {isAnswered ? (
                    <p className="rounded-xl bg-muted p-4 leading-reading">
                      <strong
                        className={
                          isRight ? "text-success" : "text-destructive"
                        }
                      >
                        {isRight ? t("quiz.right") : t("quiz.wrong")}
                      </strong>{" "}
                      {isRight ? null : (
                        <span>
                          {withInlineCode(
                            t("quiz.correctAnswerIs", {
                              answer: question.options[question.answer] ?? "",
                            })
                          )}{" "}
                        </span>
                      )}
                      {withInlineCode(question.explanation)}
                    </p>
                  ) : null}
                </div>
              </fieldset>
            </li>
          )
        })}
      </ol>
      {isFinished ? (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-track/30 bg-track/5 p-5">
          <p role="status" className="flex-1 text-lg font-semibold">
            {t("quiz.score", { total: questions.length, right })}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setAnswers(new Map())
            }}
          >
            {t("quiz.retry")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
