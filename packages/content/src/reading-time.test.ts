import { describe, expect, it } from "vitest"

import { measureBody, readingMinutesOf } from "./reading-time"

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
