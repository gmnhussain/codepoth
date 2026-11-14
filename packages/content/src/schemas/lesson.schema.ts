import { z } from "zod"

import {
  dateSchema,
  lessonIdSchema,
  slugSchema,
  textSchema,
} from "./common.schema"

/** Lesson levels, easiest first. */
export const LEVELS = ["beginner", "intermediate", "advanced"] as const

/** How many questions a quiz has (ADR-0009). */
export const QUIZ_QUESTIONS = { min: 3, max: 5 } as const

/** How many options a quiz question has (ADR-0009). */
export const QUIZ_OPTIONS = { min: 2, max: 4 } as const

/** Old lesson URL kept as a redirect: `/learn/<track>/<topic>/<lesson>`. */
const PREVIOUS_SLUG = /^\/learn(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){3}$/

/** One multiple-choice question in a lesson's `quiz`. */
export const quizQuestionSchema = z
  .strictObject({
    question: textSchema,
    /** Optional code shown with the question. */
    code: z.string().min(1).optional(),
    options: z.array(textSchema).min(QUIZ_OPTIONS.min).max(QUIZ_OPTIONS.max),
    /** 0-based index into `options`. */
    answer: z.int().nonnegative(),
    explanation: textSchema,
  })
  .refine((question) => question.answer < question.options.length, {
    path: ["answer"],
    message: "answer must be an index into options",
  })

/** Lesson frontmatter (docs/content-model.md#lesson-frontmatter). */
export const lessonFrontmatterSchema = z
  .strictObject({
    id: lessonIdSchema,
    title: textSchema,
    description: textSchema,
    /** Required unless `draft` is true (ADR-0009). */
    published: dateSchema.optional(),
    updated: dateSchema,
    level: z.enum(LEVELS),
    draft: z.boolean().default(false),
    /** Glossary entry ids (file names in `content/glossary/`). */
    glossary: z.array(slugSchema).default([]),
    /** Lesson ids to read first. */
    prerequisites: z.array(lessonIdSchema).default([]),
    /** Old URL paths after a move; each becomes a permanent redirect. */
    previousSlugs: z
      .array(
        z
          .string()
          .regex(
            PREVIOUS_SLUG,
            "An old lesson URL is /learn/track/topic/lesson"
          )
      )
      .default([]),
    /** Required unless `draft` is true (ADR-0009). */
    quiz: z
      .array(quizQuestionSchema)
      .min(QUIZ_QUESTIONS.min)
      .max(QUIZ_QUESTIONS.max)
      .optional(),
  })
  .superRefine((lesson, ctx) => {
    // Completeness rules apply to published lessons only; a draft may be a stub.
    if (!lesson.draft) {
      for (const field of ["published", "quiz"] as const) {
        if (lesson[field] === undefined) {
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is required unless the lesson is a draft`,
          })
        }
      }
    }
    // YYYY-MM-DD strings sort in date order.
    if (lesson.published !== undefined && lesson.updated < lesson.published) {
      ctx.addIssue({
        code: "custom",
        path: ["updated"],
        message: "updated cannot be before published",
      })
    }
  })

/** Validated lesson frontmatter. */
export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>
