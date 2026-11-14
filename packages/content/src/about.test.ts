import { describe, expect, it } from "vitest"

import { aboutPageFor } from "./about"
import { compileAbout } from "./mdx/compile"
import { aboutPageSchema } from "./schemas/about.schema"

const page = {
  title: "সম্পর্কে",
  description: "সাইটের কথা।",
  updated: "2026-11-14",
  draft: false,
  mdx: "",
}

describe("compileAbout", () => {
  it("accepts prose with exactly one <Privacy>", async () => {
    await expect(
      compileAbout(
        "## কাদের জন্য\n\nসবার।\n\n<Privacy>\n\nকুকি নেই।\n\n</Privacy>\n"
      )
    ).resolves.toContain("Privacy")
  })

  it("fails without a <Privacy> section", async () => {
    await expect(compileAbout("শুধু লেখা।\n")).rejects.toThrow(
      /exactly one <Privacy>/
    )
  })

  it("fails with two <Privacy> sections", async () => {
    await expect(
      compileAbout(
        "<Privacy>\n\nএক\n\n</Privacy>\n\n<Privacy>\n\nদুই\n\n</Privacy>\n"
      )
    ).rejects.toThrow(/found 2/)
  })

  it("fails on any other component", async () => {
    await expect(
      compileAbout("<Privacy>\n\nকুকি নেই।\n\n</Privacy>\n\n<Quiz />\n")
    ).rejects.toThrow(/only use <Privacy>, found <Quiz>/)
  })
})

describe("aboutPageSchema", () => {
  it("requires title, description and updated; draft defaults to false", () => {
    const parsed = aboutPageSchema.parse({
      title: "সম্পর্কে",
      description: "সাইটের কথা।",
      updated: "2026-11-14",
    })
    expect(parsed.draft).toBe(false)
    expect(() => aboutPageSchema.parse({ title: "সম্পর্কে" })).toThrow()
  })
})

describe("aboutPageFor", () => {
  it("shows a published page in every build", () => {
    expect(aboutPageFor(page, { includeDrafts: false })).toBe(page)
  })

  it("hides a draft unless drafts are included", () => {
    const draft = { ...page, draft: true }
    expect(aboutPageFor(draft, { includeDrafts: false })).toBeUndefined()
    expect(aboutPageFor(draft, { includeDrafts: true })).toBe(draft)
  })
})
