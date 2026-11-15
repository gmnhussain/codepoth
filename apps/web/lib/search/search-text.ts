/**
 * Zero-width non-joiner (U+200C) and joiner (U+200D): they change how a
 * conjunct is drawn, not the word.
 */
const JOINERS = [0x200c, 0x200d].map((code) => String.fromCodePoint(code))

/**
 * Text as the search index stores it, applied to the pages before indexing
 * and to the reader's query before searching, so both sides match
 * (ADR-0015):
 *
 * - Unicode NFC, so a Bangla letter typed as one code point (U+09DF) and as
 *   two (U+09AF + nukta U+09BC) are the same.
 * - No zero-width joiners: many keyboards type the "র + য-ফলা" conjunct
 *   with a joiner, content is written without it, and Pagefind treats the
 *   two spellings as different words.
 */
export function normalizeSearchText(text: string): string {
  return JOINERS.reduce(
    (result, joiner) => result.replaceAll(joiner, ""),
    text.normalize("NFC")
  )
}
