import { describe, expect, it } from "vitest"

import { activeLabels } from "./labels/active"
import type { Translate } from "./translate"
import { createTranslator, pickNamespaces } from "./translate"

describe("pickNamespaces", () => {
  it("keeps only the given groups, unchanged", () => {
    const picked = pickNamespaces(activeLabels, ["quiz", "copy"])
    expect(Object.keys(picked).sort()).toEqual(["copy", "quiz"])
    expect(picked.quiz).toBe(activeLabels.quiz)
  })

  it("throws, naming the group, when one is not in scope", () => {
    const scope = pickNamespaces(activeLabels, ["copy"])
    expect(() => pickNamespaces(scope, ["copy", "quiz"])).toThrow(
      'Label group "quiz" is not in scope'
    )
  })

  it("gives a translator limited to the picked groups", () => {
    const translate: Translate<"copy"> = createTranslator(
      pickNamespaces(activeLabels, ["copy"])
    )
    expect(translate("copy.short")).toBe(activeLabels.copy.short)
    // @ts-expect-error -- "quiz" is not a declared group
    expect(() => translate("quiz.retry")).toThrow("Unknown label key")
  })
})
