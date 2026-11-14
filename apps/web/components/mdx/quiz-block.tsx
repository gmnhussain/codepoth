import { t } from "@workspace/config/t"

import { Chip } from "@/components/chip"
import { BlockSection } from "@/components/mdx/block-section"
import type { QuizQuestion } from "@/components/mdx/quiz"
import { QuizQuestions } from "@/components/mdx/quiz"

/**
 * Block 7: the quiz. The section and its heading are server-rendered; the
 * questions are the interactive island. A draft without a quiz renders
 * nothing.
 */
export function QuizBlock({
  questions,
}: {
  readonly questions: readonly QuizQuestion[] | undefined
}) {
  if (questions === undefined || questions.length === 0) return null
  return (
    <BlockSection block="quiz">
      <Chip className="self-start">
        {t("quiz.count", { n: questions.length })}
      </Chip>
      <QuizQuestions questions={questions} />
    </BlockSection>
  )
}
