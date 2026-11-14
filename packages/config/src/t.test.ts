import { describe, expect, it } from "vitest"

import { createTranslator, t } from "./t"

const translate = createTranslator({
  plain: "পাঠ",
  nested: {
    count: "{n}টি পাঠ",
    pair: "{group} গ্রুপের {total}টির {done}টি শেষ",
  },
})

describe("createTranslator", () => {
  it("returns a plain label", () => {
    expect(translate("plain")).toBe("পাঠ")
  })

  it("formats number values with Bangla digits", () => {
    expect(translate("nested.count", { n: 12 })).toBe("১২টি পাঠ")
  })

  it("fills several placeholders and leaves strings as they are", () => {
    expect(
      translate("nested.pair", { group: "Hooks", total: 6, done: 2 })
    ).toBe("Hooks গ্রুপের ৬টির ২টি শেষ")
  })

  it("throws when a placeholder has no value", () => {
    expect(() => translate("nested.count")).toThrow("{n}")
    expect(() => translate("nested.count", { m: 1 })).toThrow("{n}")
  })

  it("throws for a key that is not a string leaf", () => {
    // @ts-expect-error -- "nested" is a group, not a label
    expect(() => translate("nested")).toThrow("not a string")
    // @ts-expect-error -- unknown key
    expect(() => translate("missing.key")).toThrow("Unknown label key")
  })
})

describe("t", () => {
  it("reads from the active label set", () => {
    expect(t("status.done")).toBe("পড়া শেষ")
  })
})
