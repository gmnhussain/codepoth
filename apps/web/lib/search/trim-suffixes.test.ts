import { describe, expect, it } from "vitest"

import { trimmedQuery, trimWordSuffix } from "./trim-suffixes"

describe("trimWordSuffix", () => {
  it("trims each ending from a Bangla word", () => {
    expect(trimWordSuffix("ফাংশনের")).toBe("ফাংশন")
    expect(trimWordSuffix("অ্যাপএর")).toBe("অ্যাপ")
    expect(trimWordSuffix("সার্ভারকে")).toBe("সার্ভার")
    expect(trimWordSuffix("ভাষাতে")).toBe("ভাষা")
    expect(trimWordSuffix("কোডগুলো")).toBe("কোড")
  })

  it("trims the whole plural possessive, not only its last letters", () => {
    expect(trimWordSuffix("ছাত্রদের")).toBe("ছাত্র")
  })

  it("falls back to a shorter ending when the longer one leaves too short a stem", () => {
    // "দের" would leave "চাঁ" (one letter); "ের" leaves "চাঁদ".
    expect(trimWordSuffix("চাঁদের")).toBe("চাঁদ")
  })

  it("leaves a word that is only an ending", () => {
    expect(trimWordSuffix("এর")).toBe("এর")
    expect(trimWordSuffix("কে")).toBe("কে")
    expect(trimWordSuffix("তে")).toBe("তে")
    expect(trimWordSuffix("গুলো")).toBe("গুলো")
  })

  it("leaves a word that ends in the same letters by chance when the stem would be too short", () => {
    expect(trimWordSuffix("থেকে")).toBe("থেকে")
    expect(trimWordSuffix("দিতে")).toBe("দিতে")
  })

  it("keeps a stem of exactly two letters", () => {
    expect(trimWordSuffix("কাজের")).toBe("কাজ")
    expect(trimWordSuffix("কোডকে")).toBe("কোড")
  })

  it("leaves English words alone", () => {
    expect(trimWordSuffix("useEffect")).toBe("useEffect")
    expect(trimWordSuffix("React")).toBe("React")
    expect(trimWordSuffix("make")).toBe("make")
  })

  it("trims a hyphenated ending from an English word", () => {
    expect(trimWordSuffix("state-এর")).toBe("state")
    expect(trimWordSuffix("API-তে")).toBe("API")
    expect(trimWordSuffix("-এর")).toBe("-এর")
  })

  it("leaves a word without an ending", () => {
    expect(trimWordSuffix("ফাংশন")).toBe("ফাংশন")
    expect(trimWordSuffix("")).toBe("")
  })
})

describe("trimmedQuery", () => {
  it("trims every word", () => {
    expect(trimmedQuery("ফাংশনের return")).toBe("ফাংশন return")
    expect(trimmedQuery("  কাজের   বাইরের ")).toBe("কাজ বাইর")
  })

  it("is undefined when nothing changes", () => {
    expect(trimmedQuery("useEffect")).toBeUndefined()
    expect(trimmedQuery("ফাংশন return")).toBeUndefined()
    expect(trimmedQuery("")).toBeUndefined()
    expect(trimmedQuery("   ")).toBeUndefined()
  })
})
