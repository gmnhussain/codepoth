/**
 * Id patterns as plain regular expressions, without Zod, so browser code
 * (reader progress, which is keyed by lesson id) can check ids without
 * bundling the content schemas.
 */

/** One kebab-case segment. */
export const KEBAB = "[a-z0-9]+(?:-[a-z0-9]+)*"

/** Stable lesson id: two or more kebab-case segments joined by dots (ADR-0002). */
export const LESSON_ID_PATTERN = new RegExp(`^${KEBAB}(?:\\.${KEBAB})+$`)
