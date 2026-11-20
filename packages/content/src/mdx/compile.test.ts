import { describe, expect, it } from "vitest"

import { compileGlossary, compileLesson } from "./compile"
import { BLOCKS, concept, lessonBody } from "./test-lessons"

const published = { isPublished: true }
const draft = { isPublished: false }

describe("compileLesson", () => {
  it("compiles a full lesson and lists its author sections with Bangla ids", async () => {
    const { code, sections } = await compileLesson(lessonBody(), published)
    expect(sections).toEqual([
      { id: "প্রথম-অংশ", title: "প্রথম অংশ", block: "concept" },
      { id: "উদাহরণের-অংশ", title: "উদাহরণের অংশ", block: "example" },
    ])
    expect(code).toContain('id: "প্রথম-অংশ"')
  })

  it("lists the blocks a lesson has, in order", async () => {
    const full = await compileLesson(lessonBody(), published)
    expect(full.blocks).toEqual([
      "concept",
      "example",
      "mistakes",
      "summary",
      "quiz",
      "exercises",
      "practice",
    ])
    const partial = await compileLesson(
      `${BLOCKS.concept}\n\n${BLOCKS.summary}`,
      draft
    )
    expect(partial.blocks).toEqual(["concept", "summary"])
  })

  it("highlights fenced code with a file name, and leaves inline code plain", async () => {
    const { code } = await compileLesson(
      lessonBody().replace("ধারণা।", "ধারণা `x`।"),
      published
    )
    expect(code).toContain('"data-rehype-pretty-code-title"')
    expect(code).toContain('"data-theme": "catppuccin-mocha"')
    expect(code.match(/"data-rehype-pretty-code-figure"/g)).toHaveLength(1)
  })

  it("never gives an author section a block's or a generated section's id", async () => {
    const source = lessonBody({
      concept: concept("### Summary\n\nএক।\n\n### Resources\n\nদুই।"),
    })
    const { sections } = await compileLesson(source, published)
    expect(sections.map((section) => section.id).slice(0, 2)).toEqual([
      "summary-1",
      "resources-1",
    ])
  })

  it("accepts an empty draft stub", async () => {
    await expect(compileLesson("", draft)).resolves.toEqual({
      code: expect.any(String) as string,
      blocks: [],
      sections: [],
      reading: { words: 0, codeLines: 0 },
    })
  })

  it("requires Concept, Summary, Quiz and Exercises in a published lesson", async () => {
    for (const block of ["concept", "summary", "quiz", "exercises"] as const) {
      const source = lessonBody({ [block]: null })
      await expect(compileLesson(source, published)).rejects.toThrow(
        "a published lesson needs"
      )
      await expect(compileLesson(source, draft)).resolves.toBeDefined()
    }
  })

  it("lets a published lesson leave out Example, Mistakes and Practice", async () => {
    const source = lessonBody({ example: null, mistakes: null, practice: null })
    const { blocks } = await compileLesson(source, published)
    expect(blocks).toEqual(["concept", "summary", "quiz", "exercises"])
  })

  it("rejects blocks out of order or twice, even in a draft", async () => {
    await expect(
      compileLesson(`${BLOCKS.summary}\n\n${BLOCKS.concept}`, draft)
    ).rejects.toThrow("<Concept> comes after <Summary>")
    await expect(
      compileLesson(`${BLOCKS.practice}\n\n${BLOCKS.exercises}`, draft)
    ).rejects.toThrow("<Exercises> comes after <Practice>")
    await expect(
      compileLesson(`${BLOCKS.summary}\n\n${BLOCKS.summary}`, draft)
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
    const source = `ভূমিকা।\n\n${lessonBody()}`
    await expect(compileLesson(source, published)).rejects.toThrow(
      "outside a block"
    )
    await expect(compileLesson(source, draft)).resolves.toBeDefined()
  })

  it("rejects a component outside a block, even in a draft", async () => {
    await expect(
      compileLesson("<Note>\n\nনোট।\n\n</Note>", draft)
    ).rejects.toThrow("<Note> is outside a block")
    await expect(
      compileLesson('<DeepDive title="গভীরে">\n\nলেখা।\n\n</DeepDive>', draft)
    ).rejects.toThrow("<DeepDive> is outside a block")
  })
})

describe("compileLesson reading measure", () => {
  it("leaves out the text and code of answers", async () => {
    const source = concept(
      [
        "প্রশ্ন আছে।",
        "<Think>",
        "ভেবে বলো।",
        "<Answer>\n\nগোপন উত্তর।\n\n```js\nconst hidden = 1\n```\n\n</Answer>",
        "</Think>",
      ].join("\n\n")
    )
    const { reading } = await compileLesson(source, draft)
    expect(reading).toEqual({ words: 4, codeLines: 0 })
  })

  it("leaves out hints and solutions, and counts the task and deep dives", async () => {
    const source = [
      concept(
        '<DeepDive title="গভীরে">\n\nভেতরের কথা।\n\n```js\nconst a = 1\n```\n\n</DeepDive>'
      ),
      [
        "<Exercises>",
        '<Exercise title="কাজ" level={1}>',
        "কাজটা করো।",
        "<Hint>লুকানো ইঙ্গিত এখানে।</Hint>",
        "<Solution>\n\nলুকানো সমাধান।\n\n```js\nconst b = 2\nconst c = 3\n```\n\n</Solution>",
        "</Exercise>",
        "</Exercises>",
      ].join("\n\n"),
    ].join("\n\n")
    const { reading } = await compileLesson(source, draft)
    // "ভেতরের কথা।" and "কাজটা করো।"; the deep dive's line of code.
    expect(reading).toEqual({ words: 4, codeLines: 1 })
  })

  it("counts a code block that only shows <Hint> or </Solution> as text", async () => {
    const source = concept(
      [
        "দেখো:",
        "```jsx\n<Hint>দেখাও</Hint>\n</Solution>\n```",
        "শেষ কথা।",
      ].join("\n\n")
    )
    const { reading } = await compileLesson(source, draft)
    expect(reading).toEqual({ words: 3, codeLines: 2 })
  })
})

describe("compileGlossary", () => {
  it("compiles a definition with a code example", async () => {
    const code = await compileGlossary("সংজ্ঞা।\n\n```js\nconst a = 1\n```\n")
    expect(code).toContain('"data-language": "js"')
  })
})
