import { z } from "zod"

import { slugSchema, textSchema } from "./common.schema"

/**
 * Frontmatter of `content/glossary/<id>.mdx`. The id is the file name; the
 * MDX body is the definition, with an optional code example.
 */
export const glossaryTermSchema = z.strictObject({
  /** The term in English, e.g. "Side effect". */
  term: textSchema,
  /** Its Bangla name. */
  termBn: textSchema,
  /** Track whose colour marks the term. */
  track: slugSchema,
  draft: z.boolean().default(false),
})

/** A glossary file as the content layer reads it: frontmatter plus the MDX body. */
export const glossaryDocumentSchema = glossaryTermSchema.extend({
  content: z.string(),
})

/** Validated glossary frontmatter. */
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>
