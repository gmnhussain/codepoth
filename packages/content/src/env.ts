import { z } from "zod"

/**
 * Environment variables the content layer reads (conventions §4). Documented
 * in docs/content-model.md#drafts and apps/web/.env.example.
 */
export const contentEnvSchema = z.object({
  /** "1" includes draft lessons and glossary entries (local and preview builds only). */
  CONTENT_INCLUDE_DRAFTS: z.enum(["0", "1"]).optional(),
  /** Set by Vercel on its builds; used only to refuse drafts in production. */
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
})

/** How the content graph is built. */
export type ContentOptions = {
  /** Include `draft: true` lessons and glossary entries (ADR-0009). */
  readonly includeDrafts: boolean
}

/**
 * Reads the content options from environment variables. Throws on an invalid
 * value, and when drafts are switched on for a production deploy, so a
 * mistaken setting can never publish drafts (ADR-0009).
 */
export function contentOptionsFrom(
  env: Readonly<Record<string, string | undefined>>
): ContentOptions {
  const parsed = contentEnvSchema.parse(env)
  const includeDrafts = parsed.CONTENT_INCLUDE_DRAFTS === "1"
  if (includeDrafts && parsed.VERCEL_ENV === "production") {
    throw new Error(
      "CONTENT_INCLUDE_DRAFTS=1 is not allowed in a production deploy (VERCEL_ENV=production)"
    )
  }
  return { includeDrafts }
}
