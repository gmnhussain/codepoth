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

/** How many goals a lesson states (ADR-0018). */
export const LESSON_GOALS = { min: 3, max: 5 } as const

/** How many further-reading links a lesson may list (ADR-0018). */
export const LESSON_RESOURCES = { min: 1, max: 5 } as const

/** Languages a further-reading link may be in; `en` shows a marker. */
export const RESOURCE_LANGS = ["bn", "en"] as const

/** One further-reading link in a lesson's `resources`. */
export const resourceSchema = z.strictObject({
  title: textSchema,
  url: z.url({
    protocol: /^https$/,
    error: "A resource url is an https:// link",
  }),
  lang: z.enum(RESOURCE_LANGS).optional(),
})

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

/** Lesson frontmatter fields, before the cross-field rules. */
const lessonFields = z.strictObject({
  id: lessonIdSchema,
  title: textSchema,
  /** Required unless `draft` is true (ADR-0009). */
  description: textSchema.optional(),
  /** Required unless `draft` is true (ADR-0009). */
  published: dateSchema.optional(),
  updated: dateSchema,
  /** Required unless `draft` is true (ADR-0009). */
  level: z.enum(LEVELS).optional(),
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
        .regex(PREVIOUS_SLUG, "An old lesson URL is /learn/track/topic/lesson")
    )
    .default([]),
  /** Required unless `draft` is true (ADR-0009). */
  quiz: z
    .array(quizQuestionSchema)
    .min(QUIZ_QUESTIONS.min)
    .max(QUIZ_QUESTIONS.max)
    .optional(),
  /** What the reader will be able to do; required unless `draft` is true (ADR-0018). */
  goals: z
    .array(textSchema)
    .min(LESSON_GOALS.min)
    .max(LESSON_GOALS.max)
    .optional(),
  /** Further reading, shown after the last block (ADR-0018). */
  resources: z
    .array(resourceSchema)
    .min(LESSON_RESOURCES.min)
    .max(LESSON_RESOURCES.max)
    .optional(),
})

/** Rules across fields (ADR-0009). */
function checkLesson(
  lesson: z.infer<typeof lessonFields>,
  ctx: z.core.$RefinementCtx
): void {
  // Completeness rules apply to published lessons only; a draft may be a stub.
  if (!lesson.draft) {
    for (const field of [
      "description",
      "level",
      "published",
      "quiz",
      "goals",
    ] as const) {
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
}

/** Lesson frontmatter (docs/content-model.md#lesson-frontmatter). */
export const lessonFrontmatterSchema = lessonFields.superRefine(checkLesson)

/** A lesson file as the content layer reads it: frontmatter plus the MDX body. */
export const lessonDocumentSchema = lessonFields
  .extend({ content: z.string() })
  .superRefine(checkLesson)

/** Validated lesson frontmatter. */
export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>
