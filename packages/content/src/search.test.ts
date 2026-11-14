import { describe, expect, it } from "vitest"

import { matchesQuery, normalizeForSearch } from "./search"

describe("normalizeForSearch", () => {
  it("lower-cases, collapses spaces and trims", () => {
    expect(normalizeForSearch("  useEffect   ও\tSide  Effects ")).toBe(
      "useeffect ও side effects"
    )
  })

  it("normalises Bangla so typed and stored forms match", () => {
    // য় as য + nukta and as the single code point U+09DF.
    const decomposed = String.fromCodePoint(0x9af, 0x9bc)
    const single = String.fromCodePoint(0x9df)
    expect(decomposed).not.toBe(single)
    expect(normalizeForSearch(decomposed)).toBe(normalizeForSearch(single))
  })
})

describe("matchesQuery", () => {
  const haystack = normalizeForSearch("useEffect ও Side Effects Hooks React")

  it("matches an empty or blank query", () => {
    expect(matchesQuery(haystack, "")).toBe(true)
    expect(matchesQuery(haystack, "   ")).toBe(true)
  })

  it("ignores case", () => {
    expect(matchesQuery(haystack, "USEEFFECT")).toBe(true)
  })

  it("needs every word, in any order", () => {
    expect(matchesQuery(haystack, "react effect")).toBe(true)
    expect(matchesQuery(haystack, "react vue")).toBe(false)
  })

  it("matches Bangla words", () => {
    expect(matchesQuery(normalizeForSearch("Hooks পরিচিতি"), "পরিচিতি")).toBe(
      true
    )
  })
})
