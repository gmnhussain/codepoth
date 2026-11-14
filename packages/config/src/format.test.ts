import { describe, expect, it } from "vitest"

import { formatDate, formatNumber } from "./format"

describe("formatNumber", () => {
  it("uses Bangla digits", () => {
    expect(formatNumber(0)).toBe("০")
    expect(formatNumber(42)).toBe("৪২")
  })

  it("groups large numbers", () => {
    expect(formatNumber(1234)).toBe("১,২৩৪")
  })
})

describe("formatDate", () => {
  it("formats a date-only string with a Bangla month", () => {
    expect(formatDate("2026-11-11")).toBe("১১ নভেম্বর, ২০২৬")
  })

  it("keeps the first and last day of a year on the right day", () => {
    expect(formatDate("2026-01-01")).toBe("১ জানুয়ারি, ২০২৬")
    expect(formatDate("2026-12-31")).toBe("৩১ ডিসেম্বর, ২০২৬")
  })

  it("rejects anything that is not YYYY-MM-DD", () => {
    expect(() => formatDate("2026-11-11T10:00:00Z")).toThrow(RangeError)
    expect(() => formatDate("11/11/2026")).toThrow(RangeError)
  })

  it("rejects a date that does not exist", () => {
    expect(() => formatDate("2026-02-30")).toThrow(RangeError)
  })
})
