/**
 * Which content an end-to-end run tests: a build with drafts (the content
 * there is to test) or the production content without them. Shared by the
 * orchestrator (`scripts/e2e.ts`, run directly by Node) and the Playwright
 * config, so it uses only syntax Node can strip.
 */

export const CONTENT_MODES = ["drafts", "published"] as const

export type ContentMode = (typeof CONTENT_MODES)[number]

/** The variable the orchestrator passes to Playwright. */
export const CONTENT_MODE_VARIABLE = "E2E_CONTENT"

/**
 * Written into `.next` after each build, so a run that reuses the build
 * (`--skip-build`) tests it with the content it was built with.
 */
export const BUILD_MARKER_FILE = "e2e-content-mode"

/** `CONTENT_INCLUDE_DRAFTS` for a mode's build. */
export function includeDraftsValueOf(mode: ContentMode): "0" | "1" {
  return mode === "drafts" ? "1" : "0"
}

/** A mode from text (an argument, a variable or the marker), or undefined. */
export function contentModeOf(
  value: string | undefined
): ContentMode | undefined {
  return CONTENT_MODES.find((mode) => mode === value?.trim())
}
