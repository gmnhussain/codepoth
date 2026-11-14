import { describe, expect, it } from "vitest"

import { measureBody, readingMinutesOf, roundedDuration } from "./reading-time"

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
