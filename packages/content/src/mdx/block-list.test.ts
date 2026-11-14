import { describe, expect, it } from "vitest"

import { blockNumberOf, NEXT_SECTION_NUMBER } from "./block-list"

describe("blockNumberOf", () => {
  it("numbers the blocks after the summary from 1", () => {
    expect(blockNumberOf("summary")).toBeUndefined()
    expect(blockNumberOf("concept")).toBe(1)
    expect(blockNumberOf("quiz")).toBe(6)
  })

  it("puts prev/next right after the last block", () => {
    expect(NEXT_SECTION_NUMBER).toBe(7)
  })
})
