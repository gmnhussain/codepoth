import { describe, expect, it } from "vitest"

import { compileGlossary, compileLesson } from "./compile"

const ALL_BLOCKS = [
  "<Summary>\n\n- এক\n\n</Summary>",
  "<Concept>\n\nধারণা।\n\n### প্রথম অংশ\n\nলেখা।\n\n</Concept>",
  '<Example>\n\n```js title="a.js"\nconst a = 1\n```\n\n</Example>',
  "<Mistakes>\n\n1. ভুল\n\n</Mistakes>",
  '<DeepDive hint="গভীরে">\n\n### ভেতরের কথা\n\nলেখা।\n\n</DeepDive>',
  "<Practice>\n\n- prompt\n\n</Practice>",
  "<Quiz />",
]

const published = { isPublished: true }
const draft = { isPublished: false }

describe("compileLesson", () => {
  it("compiles a full lesson and lists its author sections with Bangla ids", async () => {
    const { code, sections } = await compileLesson(
      ALL_BLOCKS.join("\n\n"),
      published
    )
    expect(sections).toEqual([
      { id: "প্রথম-অংশ", title: "প্রথম অংশ", block: "concept" },
      { id: "ভেতরের-কথা", title: "ভেতরের কথা", block: "deep-dive" },
    ])
    expect(code).toContain('id: "প্রথম-অংশ"')
  })

  it("lists the blocks a lesson has, in order", async () => {
    const full = await compileLesson(ALL_BLOCKS.join("\n\n"), published)
    expect(full.blocks).toEqual([
      "summary",
      "concept",
      "example",
      "mistakes",
      "deep-dive",
      "practice",
      "quiz",
    ])
    const partial = await compileLesson(
      [ALL_BLOCKS[0], ALL_BLOCKS[2]].join("\n\n"),
      draft
    )
    expect(partial.blocks).toEqual(["summary", "example"])
  })

  it("highlights fenced code with a file name, and leaves inline code plain", async () => {
    const { code } = await compileLesson(
      ALL_BLOCKS.join("\n\n").replace("ধারণা।", "ধারণা `x`।"),
      published
    )
    expect(code).toContain('"data-rehype-pretty-code-title"')
    expect(code).toContain('"data-theme": "catppuccin-mocha"')
    expect(code.match(/"data-rehype-pretty-code-figure"/g)).toHaveLength(1)
  })

  it("never gives an author section a block's id", async () => {
    const source = ALL_BLOCKS.join("\n\n").replace(
      "### প্রথম অংশ",
      "### Summary"
    )
    const { sections } = await compileLesson(source, published)
    expect(sections[0]?.id).toBe("summary-1")
  })

  it("accepts an empty draft stub", async () => {
    await expect(compileLesson("", draft)).resolves.toEqual({
      code: expect.any(String) as string,
      blocks: [],
      sections: [],
    })
  })

  it("requires all seven blocks in a published lesson", async () => {
    const source = ALL_BLOCKS.filter(
      (block) => !block.startsWith("<Practice")
    ).join("\n\n")
    await expect(compileLesson(source, published)).rejects.toThrow(
      "needs <Practice>"
    )
    await expect(compileLesson(source, draft)).resolves.toBeDefined()
  })

  it("rejects blocks out of order or twice, even in a draft", async () => {
    const [summary = "", concept = ""] = ALL_BLOCKS
    await expect(
      compileLesson(`${concept}\n\n${summary}`, draft)
    ).rejects.toThrow("<Summary> comes after <Concept>")
    await expect(
      compileLesson(`${summary}\n\n${summary}`, draft)
    ).rejects.toThrow("<Summary> appears twice")
  })

  it("rejects ## inside a block and headings outside blocks", async () => {
    await expect(
      compileLesson("<Concept>\n\n## বড় শিরোনাম\n\n</Concept>", draft)
    ).rejects.toThrow("author sections start at ###")
    await expect(compileLesson("### বাইরে", draft)).rejects.toThrow(
      "outside a block"
    )
  })

  it("rejects prose outside blocks only in a published lesson", async () => {
    const source = `ভূমিকা।\n\n${ALL_BLOCKS.join("\n\n")}`
    await expect(compileLesson(source, published)).rejects.toThrow(
      "outside a block"
    )
    await expect(compileLesson(source, draft)).resolves.toBeDefined()
  })
})

describe("compileGlossary", () => {
  it("compiles a definition with a code example", async () => {
    const code = await compileGlossary("সংজ্ঞা।\n\n```js\nconst a = 1\n```\n")
    expect(code).toContain('"data-language": "js"')
  })
})
