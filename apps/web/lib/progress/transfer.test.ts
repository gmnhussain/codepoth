import { describe, expect, it } from "vitest"

import { EMPTY_PROGRESS } from "./progress.schema"
import type { Progress } from "./progress.schema"
import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  MAX_IMPORT_BYTES,
  checkImportSize,
  createExport,
  parseImport,
} from "./transfer"

const INTRO = "frontend.html.intro"
const NOW = new Date(2026, 10, 15, 12, 0)
const T1 = "2026-11-10T08:00:00.000Z"

const progress: Progress = {
  lessons: {
    [INTRO]: { openedAt: T1, doneAt: T1, quiz: { score: 2, total: 3, at: T1 } },
  },
  bookmarks: { [INTRO]: { at: T1 } },
  lastRead: { id: INTRO, at: T1, anchor: "intro" },
  activity: { "2026-11-10": [INTRO] },
}

function fileWith(overrides: Record<string, unknown>): string {
  return JSON.stringify({ ...createExport(progress, NOW), ...overrides })
}

describe("createExport", () => {
  it("wraps the data with format, version and export time", () => {
    expect(createExport(progress, NOW)).toEqual({
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: NOW.toISOString(),
      data: progress,
    })
  })
})

describe("parseImport", () => {
  it("round-trips an export", () => {
    const text = JSON.stringify(createExport(progress, NOW))
    expect(parseImport(text, NOW)).toEqual({ ok: true, data: progress })
  })

  it("round-trips empty progress", () => {
    const text = JSON.stringify(createExport(EMPTY_PROGRESS, NOW))
    expect(parseImport(text, NOW)).toEqual({ ok: true, data: EMPTY_PROGRESS })
  })

  it.each(["", "{", "not json", "{'format': 1}"])(
    "reports text that is not JSON (%j)",
    (text) => {
      expect(parseImport(text, NOW)).toEqual({ ok: false, error: "not-json" })
    }
  )

  it.each([
    ["an array", "[]"],
    ["a number", "1"],
    ["null", "null"],
    ["another format", fileWith({ format: "something-else" })],
    ["no format", JSON.stringify({ version: 1, data: progress })],
  ])("reports a file in the wrong format: %s", (_, text) => {
    expect(parseImport(text, NOW)).toEqual({
      ok: false,
      error: "wrong-format",
    })
  })

  it.each([2, 0, "1", undefined])(
    "reports an unsupported version (%j)",
    (version) => {
      expect(parseImport(fileWith({ version }), NOW)).toEqual({
        ok: false,
        error: "unsupported-version",
      })
    }
  )

  it.each([
    ["missing data", { data: undefined }],
    ["missing export time", { exportedAt: undefined }],
    ["a bad export time", { exportedAt: "today" }],
    [
      "one invalid lesson",
      {
        data: {
          ...progress,
          lessons: { ...progress.lessons, "bad id": { openedAt: T1 } },
        },
      },
    ],
    [
      "a quiz score above its total",
      {
        data: {
          ...progress,
          lessons: {
            [INTRO]: { openedAt: T1, quiz: { score: 4, total: 3, at: T1 } },
          },
        },
      },
    ],
    ["a missing section", { data: { lessons: {}, bookmarks: {} } }],
  ])("reports invalid data: %s", (_, overrides) => {
    expect(parseImport(fileWith(overrides), NOW)).toEqual({
      ok: false,
      error: "invalid-data",
    })
  })

  it("prunes activity older than 140 days", () => {
    const text = fileWith({
      data: {
        ...progress,
        activity: { "2026-06-28": [INTRO], "2026-06-29": [INTRO] },
      },
    })
    const result = parseImport(text, NOW)
    expect(result.ok && result.data.activity).toEqual({
      "2026-06-29": [INTRO],
    })
  })
})

describe("checkImportSize", () => {
  it("accepts a file of exactly 1 MB and refuses one byte more", () => {
    expect(MAX_IMPORT_BYTES).toBe(1024 * 1024)
    expect(checkImportSize(0)).toBeUndefined()
    expect(checkImportSize(MAX_IMPORT_BYTES)).toBeUndefined()
    expect(checkImportSize(MAX_IMPORT_BYTES + 1)).toBe("too-large")
  })
})
