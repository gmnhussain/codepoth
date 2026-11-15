/**
 * Bangla case and plural endings trimmed from query words, tried longest
 * first. The index has no Bangla stemmer, so "ফাংশনের" does not find
 * "ফাংশন" (measured in ADR-0015). "দের" comes before "ের" so a plural
 * possessive loses the whole ending ("ছাত্রদের" → "ছাত্র").
 */
export const SUFFIXES = ["গুলো", "দের", "এর", "ের", "কে", "তে"] as const

/**
 * A stem keeps at least this many Bangla letters (consonants and
 * independent vowels; vowel signs and other marks do not count), so a
 * short word that only ends in the same letters stays whole: "থেকে" would
 * otherwise become "থে".
 */
export const MIN_STEM_LETTERS = 2

const BANGLA = /\p{Script=Bengali}/u
const BANGLA_LETTER = /(?=\p{Script=Bengali})\p{L}/gu
const SPACES = /\s+/u

function letterCount(text: string): number {
  return text.match(BANGLA_LETTER)?.length ?? 0
}

/**
 * The word without one Bangla ending, or the word unchanged. An English
 * word with a hyphenated ending ("state-এর", "API-তে") loses the ending;
 * any other word without Bangla letters is left alone. If the longest
 * matching ending would leave too short a stem, shorter endings are tried.
 */
export function trimWordSuffix(word: string): string {
  for (const suffix of SUFFIXES) {
    const hyphenated = `-${suffix}`
    if (word.endsWith(hyphenated) && word.length > hyphenated.length) {
      return word.slice(0, -hyphenated.length)
    }
  }
  if (!BANGLA.test(word)) return word
  for (const suffix of SUFFIXES) {
    if (!word.endsWith(suffix)) continue
    const stem = word.slice(0, -suffix.length)
    if (letterCount(stem) >= MIN_STEM_LETTERS) return stem
  }
  return word
}

/**
 * The query with every word trimmed, or `undefined` when no word changed.
 * The search runs it beside the reader's own query and only adds its
 * results (ADR-0015), so a trim never hides a match.
 */
export function trimmedQuery(query: string): string | undefined {
  const words = query
    .trim()
    .split(SPACES)
    .filter((word) => word !== "")
  const trimmed = words.map(trimWordSuffix)
  return trimmed.some((word, index) => word !== words[index])
    ? trimmed.join(" ")
    : undefined
}
