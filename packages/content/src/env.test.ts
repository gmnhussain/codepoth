import { describe, expect, it } from "vitest"

import { contentOptionsFrom } from "./env"

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
