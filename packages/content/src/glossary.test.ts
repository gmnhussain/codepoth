import { describe, expect, it } from "vitest"

import { glossarySearchText, groupByLetter, letterOf } from "./glossary"
import type { GraphTerm } from "./graph"

function term(id: string, name: string, content = "সংজ্ঞা।"): GraphTerm {
  return {
    id,
    term: name,
    termBn: `${name} (বাংলা)`,
    track: "frontend",
    draft: false,
    content,
    mdx: "",
    lessonIds: [],
  }
}

describe("letterOf", () => {
  it("files a term under its first letter, upper-cased", () => {
    expect(letterOf("closure")).toBe("C")
    expect(letterOf("  JWT")).toBe("J")
  })

  it("files a term that does not start with A–Z under #", () => {
    expect(letterOf("2FA")).toBe("#")
    expect(letterOf(".env")).toBe("#")
  })
})

describe("groupByLetter", () => {
  it("groups in A–Z order with # last, keeping each term's order", () => {
    const groups = groupByLetter([
      term("api", "API"),
      term("two-fa", "2FA"),
      term("cors", "CORS"),
      term("closure", "Closure"),
    ])
    expect(
      groups.map((group) => [group.letter, group.terms.map((item) => item.id)])
    ).toEqual([
      ["A", ["api"]],
      ["C", ["cors", "closure"]],
      ["#", ["two-fa"]],
    ])
  })
})

describe("glossarySearchText", () => {
  it("covers the term, the Bangla name and the definition, not code", () => {
    const text = glossarySearchText(
      term(
        "jwt",
        "JWT",
        "সই করা টোকেন।\n\n```js\nconst secretOnlyInCode = 1\n```\n"
      )
    )
    expect(text).toContain("jwt")
    expect(text).toContain("(বাংলা)")
    expect(text).toContain("টোকেন")
    expect(text).not.toContain("secretonlyincode")
  })
})
