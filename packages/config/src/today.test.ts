import { describe, expect, it } from "vitest"

import { site } from "./site"
import { dateIn, siteToday } from "./today"

describe("siteToday", () => {
  it("uses the site time zone, Asia/Dhaka", () => {
    expect(site.timeZone).toBe("Asia/Dhaka")
  })

  it("is already the next day in Dhaka at 21:00 UTC", () => {
    // 2026-11-15 03:00 in Dhaka (UTC+6)
    expect(siteToday(new Date("2026-11-14T21:00:00Z"))).toBe("2026-11-15")
  })

  it("is still the same day in Dhaka at 17:59 UTC", () => {
    // 2026-11-14 23:59 in Dhaka
    expect(siteToday(new Date("2026-11-14T17:59:00Z"))).toBe("2026-11-14")
  })
})

describe("dateIn", () => {
  it("formats as YYYY-MM-DD with Latin digits", () => {
    expect(dateIn("UTC", new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05")
  })
})
