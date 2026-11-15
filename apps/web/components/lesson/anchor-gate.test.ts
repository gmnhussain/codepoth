import { describe, expect, it } from "vitest"

import { createAnchorGate } from "@/components/lesson/anchor-gate"

const LESSON = "frontend.html.intro"
const OTHER = "frontend.html.forms"

describe("createAnchorGate", () => {
  it("never saves the first section of a page view", () => {
    const shouldSave = createAnchorGate()
    expect(shouldSave(LESSON, "summary")).toBe(false)
  })

  it("keeps refusing while the reader stays in that first section", () => {
    const shouldSave = createAnchorGate()
    shouldSave(LESSON, "summary")
    // React may run the effect again with the same value (Strict Mode).
    expect(shouldSave(LESSON, "summary")).toBe(false)
    expect(shouldSave(LESSON, "summary")).toBe(false)
  })

  it("saves once the section has changed, the first one included after that", () => {
    const shouldSave = createAnchorGate()
    shouldSave(LESSON, "summary")
    expect(shouldSave(LESSON, "examples")).toBe(true)
    expect(shouldSave(LESSON, "summary")).toBe(true)
  })

  it("starts over for another lesson", () => {
    const shouldSave = createAnchorGate()
    shouldSave(LESSON, "summary")
    expect(shouldSave(LESSON, "examples")).toBe(true)
    expect(shouldSave(OTHER, "summary")).toBe(false)
    expect(shouldSave(OTHER, "summary")).toBe(false)
    expect(shouldSave(OTHER, "examples")).toBe(true)
  })
})
