/**
 * Reading time of a lesson body (ADR-0009, docs/content-model.md).
 * Prose words are read at a Bangla reading speed; code is read line by line.
 */

/** Bangla prose read per minute. A starting estimate; tune with real readers. */
export const WORDS_PER_MINUTE = 150

/** Lines of code read per minute. */
export const CODE_LINES_PER_MINUTE = 10

const CODE_FENCE = /^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\1[ \t]*$/gm
const JSX_TAG = /<\/?[A-Za-z][^<>]*\/?>/g
const IMPORT_EXPORT = /^(?:import|export)\s[^\n]*$/gm
/** A word has at least one letter or digit, so list markers and "|" do not count. */
const HAS_LETTER = /[\p{L}\p{N}]/u

/** Words of prose and lines of code in an MDX body. */
export type BodyMeasure = {
  readonly words: number
  readonly codeLines: number
}

/** Words of prose and lines of code in an MDX body. */
export function measureBody(body: string): BodyMeasure {
  let codeLines = 0
  const prose = body.replace(CODE_FENCE, (_fence, _marker, code: string) => {
    codeLines += code.split("\n").filter((line) => line.trim() !== "").length
    return " "
  })
  const words = prose
    .replace(IMPORT_EXPORT, " ")
    .replace(JSX_TAG, " ")
    .split(/\s+/)
    .filter((word) => HAS_LETTER.test(word)).length
  return { words, codeLines }
}

/**
 * `body` with the given `[start, end)` ranges blanked out. The compiler finds
 * a lesson's answers, hints and solutions on the parsed tree and passes their
 * ranges here, so reading time leaves them out (ADR-0018) and text that only
 * looks like a tag, such as `<Hint>` inside a code block, is never cut.
 */
export function withoutRanges(
  body: string,
  ranges: readonly (readonly [number, number])[]
): string {
  let result = ""
  let from = 0
  for (const [start, end] of [...ranges].sort((a, b) => a[0] - b[0])) {
    if (start < from) continue
    result += `${body.slice(from, start)}\n`
    from = end
  }
  return result + body.slice(from)
}

/** Minutes to read a measured body, rounded up, at least 1. */
export function readingMinutesFrom({ words, codeLines }: BodyMeasure): number {
  const minutes = words / WORDS_PER_MINUTE + codeLines / CODE_LINES_PER_MINUTE
  return Math.max(1, Math.ceil(minutes))
}

/** Minutes to read an MDX body, rounded up, at least 1. */
export function readingMinutesOf(body: string): number {
  return readingMinutesFrom(measureBody(body))
}

/** From this many minutes a total is shown in hours. */
export const HOURS_FROM_MINUTES = 90

/** Totals under an hour and a half are rounded to this many minutes. */
const MINUTE_STEP = 5

/**
 * A total reading time as the design shows it: whole hours from 90 minutes,
 * otherwise minutes rounded to 5 (never 0).
 */
export function roundedDuration(minutes: number): {
  readonly unit: "hours" | "minutes"
  readonly value: number
} {
  if (minutes >= HOURS_FROM_MINUTES) {
    return { unit: "hours", value: Math.round(minutes / 60) }
  }
  const rounded = Math.round(minutes / MINUTE_STEP) * MINUTE_STEP
  return { unit: "minutes", value: Math.max(MINUTE_STEP, rounded) }
}
