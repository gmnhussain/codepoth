import { z } from "zod"

import { dateSchema, textSchema } from "./common.schema"

/**
 * Frontmatter of `content/pages/about.mdx` (ADR-0012). The MDX body is the
 * page's prose, with exactly one `<Privacy>` section.
 */
export const aboutPageSchema = z.strictObject({
  title: textSchema,
  /** The page's lead and meta description. */
  description: textSchema,
  updated: dateSchema,
  draft: z.boolean().default(false),
})

/** The about file as the content layer reads it: frontmatter plus the MDX body. */
export const aboutDocumentSchema = aboutPageSchema.extend({
  content: z.string(),
})

/** Validated about-page frontmatter. */
export type AboutPage = z.infer<typeof aboutPageSchema>
