import { describe, expect, it } from "vitest"

import {
  ACTIVITY_DAYS,
  firstActivityDay,
  localDay,
  pruneActivity,
  shiftDay,
} from "./days"

describe("localDay", () => {
  it("is the reader's local calendar date, zero-padded", () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05")
    expect(localDay(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31")
  })
})

describe("shiftDay", () => {
  it("moves across month, year and leap-day boundaries", () => {
    expect(shiftDay("2026-11-30", 1)).toBe("2026-12-01")
    expect(shiftDay("2027-01-01", -1)).toBe("2026-12-31")
    expect(shiftDay("2028-02-28", 1)).toBe("2028-02-29")
    expect(shiftDay("2026-11-15", 0)).toBe("2026-11-15")
  })
})

describe("firstActivityDay", () => {
  it("starts the window so it holds exactly 140 days including today", () => {
    expect(ACTIVITY_DAYS).toBe(140)
    expect(firstActivityDay("2026-11-15")).toBe("2026-06-29")
    expect(shiftDay(firstActivityDay("2026-11-15"), ACTIVITY_DAYS - 1)).toBe(
      "2026-11-15"
    )
  })
})

describe("pruneActivity", () => {
  const ids = ["frontend.html.intro"]

  it("keeps the first day of the window and drops the day before it", () => {
    const pruned = pruneActivity(
      { "2026-06-28": ids, "2026-06-29": ids, "2026-11-15": ids },
      "2026-11-15"
    )
    expect(Object.keys(pruned)).toEqual(["2026-06-29", "2026-11-15"])
  })

  it("keeps days after today", () => {
    expect(pruneActivity({ "2026-11-20": ids }, "2026-11-15")).toEqual({
      "2026-11-20": ids,
    })
  })

  it("returns the same object when nothing is dropped", () => {
    const activity = { "2026-11-14": ids }
    expect(pruneActivity(activity, "2026-11-15")).toBe(activity)
    const empty = {}
    expect(pruneActivity(empty, "2026-11-15")).toBe(empty)
  })
})
