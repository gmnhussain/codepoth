import { describe, expect, it } from "vitest"

import { LABEL_SETS } from "./labels"
import { labelSetSchema } from "./labels.schema"

const reference = LABEL_SETS["bn-metro"]
const schema = labelSetSchema(reference)

function leaves(
  tree: Readonly<Record<string, unknown>>,
  prefix = ""
): Map<string, string> {
  const result = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === "" ? key : `${prefix}.${key}`
    if (typeof value === "string") {
      result.set(path, value)
    } else if (typeof value === "object" && value !== null) {
      for (const [leafPath, leaf] of leaves(
        value as Record<string, unknown>,
        path
      ))
        result.set(leafPath, leaf)
    }
  }
  return result
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? "").sort()
}

describe.each(Object.entries(LABEL_SETS))("label set %s", (_id, labels) => {
  it("has exactly the keys of bn-metro, each a non-empty string", () => {
    expect(schema.safeParse(labels).error?.issues ?? []).toEqual([])
  })

  it("uses the same placeholders as bn-metro for every key", () => {
    const own = leaves(labels)
    for (const [key, text] of leaves(reference)) {
      expect(placeholders(own.get(key) ?? ""), key).toEqual(placeholders(text))
    }
  })
})

describe("labelSetSchema", () => {
  it("rejects a set with a missing key", () => {
    const withoutStatus = Object.fromEntries(
      Object.entries(reference).filter(([key]) => key !== "status")
    )
    expect(schema.safeParse(withoutStatus).success).toBe(false)
  })

  it("rejects a set with an extra key", () => {
    expect(schema.safeParse({ ...reference, extra: "x" }).success).toBe(false)
  })

  it("rejects an empty string", () => {
    const terms = { ...reference.terms, track: " " }
    expect(schema.safeParse({ ...reference, terms }).success).toBe(false)
  })
})
