import { describe, expect, it } from "vitest"

import {
  measureBody,
  readingMinutesFrom,
  readingMinutesOf,
  roundedDuration,
  withoutRanges,
} from "./reading-time"

describe("withoutRanges", () => {
  it("blanks out the ranges in any order and keeps the rest", () => {
    const body = "one two three four"
    expect(
      withoutRanges(body, [
        [8, 13],
        [0, 3],
      ])
    ).toBe("\n two \n four")
  })

  it("returns the body unchanged without ranges, and skips an overlapping one", () => {
    expect(withoutRanges("এক দুই", [])).toBe("এক দুই")
    expect(
      withoutRanges("abcdef", [
        [1, 4],
        [2, 3],
      ])
    ).toBe("a\nef")
  })
})

describe("readingMinutesFrom", () => {
  it("rounds a measure up to whole minutes, at least 1", () => {
    expect(readingMinutesFrom({ words: 0, codeLines: 0 })).toBe(1)
    expect(readingMinutesFrom({ words: 151, codeLines: 0 })).toBe(2)
    expect(readingMinutesFrom({ words: 0, codeLines: 21 })).toBe(3)
  })
})

describe("roundedDuration", () => {
  it("rounds totals under 90 minutes to 5 minutes, never 0", () => {
    expect(roundedDuration(1)).toEqual({ unit: "minutes", value: 5 })
    expect(roundedDuration(12)).toEqual({ unit: "minutes", value: 10 })
    expect(roundedDuration(13)).toEqual({ unit: "minutes", value: 15 })
    expect(roundedDuration(89)).toEqual({ unit: "minutes", value: 90 })
  })

  it("switches to whole hours at 90 minutes", () => {
    expect(roundedDuration(90)).toEqual({ unit: "hours", value: 2 })
    expect(roundedDuration(150)).toEqual({ unit: "hours", value: 3 })
  })
})

describe("measureBody", () => {
  it("counts prose words and non-empty code lines separately", () => {
    const body = [
      "## শিরোনাম",
      "",
      "এক দুই তিন।",
      "",
      "```js",
      "const a = 1",
      "",
      "a++",
      "```",
    ].join("\n")
    expect(measureBody(body)).toEqual({ words: 4, codeLines: 2 })
  })

  it("ignores MDX tags, imports and markdown symbols", () => {
    const body = [
      'import { X } from "y"',
      "",
      "<Summary>",
      "- এক",
      "- দুই",
      "</Summary>",
      "| a | b |",
    ].join("\n")
    expect(measureBody(body)).toEqual({ words: 4, codeLines: 0 })
  })
})

describe("readingMinutesOf", () => {
  it("is at least 1 minute", () => {
    expect(readingMinutesOf("")).toBe(1)
  })

  it("rounds up at exact boundaries", () => {
    expect(
      readingMinutesOf(Array.from({ length: 150 }, () => "শব্দ").join(" "))
    ).toBe(1)
    expect(
      readingMinutesOf(Array.from({ length: 151 }, () => "শব্দ").join(" "))
    ).toBe(2)
  })

  it("adds code at 10 lines per minute", () => {
    const code = [
      "```",
      ...Array.from({ length: 20 }, (_, index) => `line${String(index)}`),
      "```",
    ].join("\n")
    expect(readingMinutesOf(code)).toBe(2)
  })
})
