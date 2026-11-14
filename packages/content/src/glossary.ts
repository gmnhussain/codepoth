import type { GraphTerm } from "./graph"
import { normalizeForSearch } from "./search"

/** The A–Z bar: one button per letter, terms grouped under these. */
export const GLOSSARY_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const

/** Group for terms that do not start with A–Z (a digit, a symbol). */
export const OTHER_LETTER = "#"

const CODE_FENCE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm

/** The letter a term is filed under: its first A–Z letter, else "#". */
export function letterOf(term: string): string {
  const first = term.trim().charAt(0).toUpperCase()
  return GLOSSARY_LETTERS.some((letter) => letter === first)
    ? first
    : OTHER_LETTER
}

/**
 * Normalised text a glossary search matches: the term, its Bangla name and
 * the definition's prose (code examples left out).
 */
export function glossarySearchText(term: GraphTerm): string {
  const prose = term.content.replace(CODE_FENCE, " ")
  return normalizeForSearch(`${term.term} ${term.termBn} ${prose}`)
}

/** Terms grouped by letter, in A–Z order with "#" last; terms keep their order. */
export function groupByLetter(
  terms: readonly GraphTerm[]
): { readonly letter: string; readonly terms: readonly GraphTerm[] }[] {
  const groups = new Map<string, GraphTerm[]>()
  for (const term of terms) {
    const letter = letterOf(term.term)
    groups.set(letter, [...(groups.get(letter) ?? []), term])
  }
  return [...GLOSSARY_LETTERS, OTHER_LETTER].flatMap((letter) => {
    const group = groups.get(letter)
    return group === undefined ? [] : [{ letter, terms: group }]
  })
}
