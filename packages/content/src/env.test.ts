import { describe, expect, it } from "vitest"

import { contentOptionsFrom, isIndexableBuild } from "./env"

describe("contentOptionsFrom", () => {
  it("includes drafts only when CONTENT_INCLUDE_DRAFTS is 1", () => {
    expect(contentOptionsFrom({})).toEqual({ includeDrafts: false })
    expect(contentOptionsFrom({ CONTENT_INCLUDE_DRAFTS: "0" })).toEqual({
      includeDrafts: false,
    })
    expect(contentOptionsFrom({ CONTENT_INCLUDE_DRAFTS: "1" })).toEqual({
      includeDrafts: true,
    })
  })

  it("refuses drafts in a production deploy, allows them in preview", () => {
    expect(() =>
      contentOptionsFrom({
        CONTENT_INCLUDE_DRAFTS: "1",
        VERCEL_ENV: "production",
      })
    ).toThrow("not allowed in a production deploy")
    expect(
      contentOptionsFrom({ CONTENT_INCLUDE_DRAFTS: "1", VERCEL_ENV: "preview" })
    ).toEqual({ includeDrafts: true })
    expect(
      contentOptionsFrom({
        CONTENT_INCLUDE_DRAFTS: "0",
        VERCEL_ENV: "production",
      })
    ).toEqual({ includeDrafts: false })
  })

  it("rejects any other value", () => {
    expect(() =>
      contentOptionsFrom({ CONTENT_INCLUDE_DRAFTS: "true" })
    ).toThrow()
    expect(() => contentOptionsFrom({ VERCEL_ENV: "prod" })).toThrow()
  })
})

describe("isIndexableBuild", () => {
  it("is true only for a production deploy without drafts", () => {
    expect(isIndexableBuild({ VERCEL_ENV: "production" })).toBe(true)
    expect(
      isIndexableBuild({
        VERCEL_ENV: "production",
        CONTENT_INCLUDE_DRAFTS: "0",
      })
    ).toBe(true)
  })

  it("is false for previews, development and local builds", () => {
    expect(isIndexableBuild({ VERCEL_ENV: "preview" })).toBe(false)
    expect(isIndexableBuild({ VERCEL_ENV: "development" })).toBe(false)
    expect(isIndexableBuild({})).toBe(false)
  })

  it("is false whenever drafts are included", () => {
    expect(
      isIndexableBuild({ VERCEL_ENV: "preview", CONTENT_INCLUDE_DRAFTS: "1" })
    ).toBe(false)
    expect(isIndexableBuild({ CONTENT_INCLUDE_DRAFTS: "1" })).toBe(false)
  })
})
