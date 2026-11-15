import { describe, expect, it } from "vitest"

import { normalizeSearchText } from "./search-text"

/** Text from code points, so invisible characters stay readable here. */
const fromCodes = (...codes: number[]) => String.fromCodePoint(...codes)

const HA = 0x09b9 // হ
const YA = 0x09af // য
const NUKTA = 0x09bc
const YYA = 0x09df // য়, one code point
const ZWNJ = 0x200c
const ZWJ = 0x200d

describe("normalizeSearchText", () => {
  it("gives the same text for a Bangla letter typed as one or two code points", () => {
    expect(normalizeSearchText(fromCodes(HA, YYA))).toBe(
      normalizeSearchText(fromCodes(HA, YA, NUKTA))
    )
  })

  it("drops zero-width joiners, so a conjunct typed with one matches the plain spelling", () => {
    expect(normalizeSearchText(`ট্র${fromCodes(ZWJ)}্যাকিং`)).toBe("ট্র্যাকিং")
    expect(normalizeSearchText(`ক্${fromCodes(ZWNJ)}ষ`)).toBe("ক্ষ")
  })

  it("leaves other text unchanged", () => {
    expect(normalizeSearchText("useEffect ও state")).toBe("useEffect ও state")
    expect(normalizeSearchText("")).toBe("")
  })
})
