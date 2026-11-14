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
export function measureBody(body: string): {
  words: number
  codeLines: number
} {
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

/** Minutes to read an MDX body, rounded up, at least 1. */
export function readingMinutesOf(body: string): number {
  const { words, codeLines } = measureBody(body)
  const minutes = words / WORDS_PER_MINUTE + codeLines / CODE_LINES_PER_MINUTE
  return Math.max(1, Math.ceil(minutes))
}
