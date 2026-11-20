import { describe, expect, it } from "vitest"

import { compileLesson } from "./compile"
import { concept, exercise, exercises, lessonBody } from "./test-lessons"

const published = { isPublished: true }
const draft = { isPublished: false }

/** A full published lesson whose Concept body is `body`. */
function withConcept(body: string): string {
  return lessonBody({ concept: concept(body) })
}

/** A full lesson whose Exercises block is `block`. */
function withExercises(block: string): string {
  return lessonBody({ exercises: block })
}

const THINK =
  "<Think>\n\nপ্রশ্ন?\n\n<Answer>\n\nউত্তর।\n\n</Answer>\n\n</Think>"
const DEEP_DIVE =
  '<DeepDive title="গভীরে" hint="ভেতরের কথা">\n\nলেখা।\n\n</DeepDive>'

describe("lesson components", () => {
  it("accepts every inner component in its place in a published lesson", async () => {
    const body = [
      "<Note>\n\nনোট।\n\n</Note>",
      "<Tip>\n\nটিপ।\n\n</Tip>",
      "<Pitfall>\n\nসাবধান।\n\n</Pitfall>",
      "<Steps>\n\n1. এক\n2. দুই\n\n</Steps>",
      THINK,
      DEEP_DIVE,
      DEEP_DIVE,
      'শব্দ <Term id="hook">hook</Term>।',
    ].join("\n\n")
    const source = lessonBody({
      concept: concept(body),
      mistakes:
        '<Mistakes>\n\n1. <Term id="hook">hook</Term> ভুল\n\n</Mistakes>',
    })
    await expect(compileLesson(source, published)).resolves.toBeDefined()
  })

  it("keeps Note, Tip, Pitfall, Steps, Think and DeepDive inside Concept, even in a draft", async () => {
    for (const part of [
      "<Note>\n\nনোট।\n\n</Note>",
      "<Tip>\n\nটিপ।\n\n</Tip>",
      "<Pitfall>\n\nসাবধান।\n\n</Pitfall>",
      "<Steps>\n\n1. এক\n\n</Steps>",
      THINK,
      DEEP_DIVE,
    ]) {
      const source = `<Example>\n\n${part}\n\n</Example>`
      await expect(compileLesson(source, draft)).rejects.toThrow(
        "may only sit inside <Concept>"
      )
    }
  })

  it("never puts a Think or DeepDive inside another", async () => {
    const deepInThink = concept(
      `<Think>\n\nপ্রশ্ন?\n\n${DEEP_DIVE}\n\n<Answer>\n\nউত্তর।\n\n</Answer>\n\n</Think>`
    )
    await expect(compileLesson(deepInThink, draft)).rejects.toThrow(
      "<DeepDive> cannot sit inside another"
    )
    const thinkInDeep = concept(
      `<DeepDive title="গভীরে">\n\n${THINK}\n\n</DeepDive>`
    )
    await expect(compileLesson(thinkInDeep, draft)).rejects.toThrow(
      "<Think> cannot sit inside another"
    )
  })

  it("needs a Think's Answer only in a published lesson", async () => {
    const noAnswer = "<Think>\n\nপ্রশ্ন?\n\n</Think>"
    await expect(
      compileLesson(withConcept(noAnswer), published)
    ).rejects.toThrow("needs its <Answer>")
    await expect(compileLesson(concept(noAnswer), draft)).resolves.toBeDefined()
  })

  it("rejects two Answers, an Answer that is not last, and an Answer outside Think", async () => {
    const answer = "<Answer>\n\nউত্তর।\n\n</Answer>"
    await expect(
      compileLesson(
        concept(`<Think>\n\n${answer}\n\n${answer}\n\n</Think>`),
        draft
      )
    ).rejects.toThrow("it takes exactly one")
    await expect(
      compileLesson(
        concept(`<Think>\n\n${answer}\n\nপরে আরও লেখা।\n\n</Think>`),
        draft
      )
    ).rejects.toThrow("<Answer> must be the last part of <Think>")
    await expect(compileLesson(concept(answer), draft)).rejects.toThrow(
      "<Answer> must sit directly inside <Think>"
    )
  })

  it("needs a DeepDive title", async () => {
    await expect(
      compileLesson(concept("<DeepDive>\n\nলেখা।\n\n</DeepDive>"), draft)
    ).rejects.toThrow('<DeepDive> needs a title="…"')
  })

  it("accepts 2 to 4 exercises; fewer only in a draft, more never", async () => {
    for (const count of [2, 4]) {
      const items = Array.from({ length: count }, (_, i) =>
        exercise(`কাজ ${String(i)}`)
      )
      await expect(
        compileLesson(withExercises(exercises(...items)), published)
      ).resolves.toBeDefined()
    }
    const one = withExercises(exercises(exercise()))
    await expect(compileLesson(one, published)).rejects.toThrow(
      "needs at least 2 exercises, found 1"
    )
    await expect(compileLesson(one, draft)).resolves.toBeDefined()
    const five = Array.from({ length: 5 }, (_, i) =>
      exercise(`কাজ ${String(i)}`)
    )
    await expect(
      compileLesson(withExercises(exercises(...five)), draft)
    ).rejects.toThrow("has 5 exercises; it takes at most 4")
  })

  it("keeps Exercise inside Exercises, and Hint and Solution inside Exercise", async () => {
    await expect(compileLesson(concept(exercise()), draft)).rejects.toThrow(
      "<Exercise> must sit directly inside <Exercises>"
    )
    await expect(
      compileLesson(concept("<Hint>ইঙ্গিত।</Hint>"), draft)
    ).rejects.toThrow("<Hint> must sit directly inside <Exercise>")
    await expect(
      compileLesson(exercises("<Solution>\n\nসমাধান।\n\n</Solution>"), draft)
    ).rejects.toThrow("<Solution> must sit directly inside <Exercise>")
  })

  it("needs a Hint and a Solution only in a published lesson", async () => {
    const noHint = exercise("এক", { hints: 0 })
    const noSolution = exercise("দুই").replace(
      "<Solution>\n\nসমাধান।\n\n</Solution>",
      ""
    )
    for (const [item, message] of [
      [noHint, "needs at least one <Hint>"],
      [noSolution, "needs its <Solution>"],
    ] as const) {
      const source = withExercises(exercises(item, exercise("তিন")))
      await expect(compileLesson(source, published)).rejects.toThrow(message)
      await expect(compileLesson(source, draft)).resolves.toBeDefined()
    }
  })

  it("accepts several hints, and rejects two Solutions or a Solution before a Hint", async () => {
    const twoHints = withExercises(
      exercises(exercise("এক", { hints: 2 }), exercise("দুই"))
    )
    await expect(compileLesson(twoHints, published)).resolves.toBeDefined()

    const solution = "<Solution>\n\nসমাধান।\n\n</Solution>"
    const twoSolutions = exercise("এক").replace(
      solution,
      `${solution}\n\n${solution}`
    )
    await expect(compileLesson(exercises(twoSolutions), draft)).rejects.toThrow(
      "has 2 <Solution>s; it takes exactly one"
    )

    const hint = "<Hint>ইঙ্গিত 1।</Hint>"
    const solutionFirst = exercise("এক").replace(
      `${hint}\n\n${solution}`,
      `${solution}\n\n${hint}`
    )
    expect(solutionFirst).not.toBe(exercise("এক"))
    await expect(
      compileLesson(exercises(solutionFirst), draft)
    ).rejects.toThrow("<Solution> must be the last part, after every <Hint>")
  })

  it("accepts level 1 to 3 only, written as a number", async () => {
    for (const level of ["{1}", "{3}"]) {
      await expect(
        compileLesson(exercises(exercise("এক", { level })), draft)
      ).resolves.toBeDefined()
    }
    for (const level of ["{0}", "{4}", '"1"']) {
      await expect(
        compileLesson(exercises(exercise("এক", { level })), draft)
      ).rejects.toThrow("needs level={1}, level={2} or level={3}")
    }
    const noLevel = exercise("এক").replace(" level={1}", "")
    await expect(compileLesson(exercises(noLevel), draft)).rejects.toThrow(
      "needs level={1}"
    )
    const noTitle = exercise("এক").replace(' title="এক"', "")
    await expect(compileLesson(exercises(noTitle), draft)).rejects.toThrow(
      '<Exercise> needs a title="…"'
    )
  })

  it("rejects an unknown component and a block inside a block", async () => {
    await expect(
      compileLesson(concept("<Notes>\n\nভুল নাম।\n\n</Notes>"), draft)
    ).rejects.toThrow("unknown component <Notes>")
    await expect(
      compileLesson(concept("<Summary>\n\n- এক\n\n</Summary>"), draft)
    ).rejects.toThrow("<Summary> is a block")
  })

  it("rejects a heading inside a component", async () => {
    await expect(
      compileLesson(concept("<Note>\n\n### নোটের শিরোনাম\n\n</Note>"), draft)
    ).rejects.toThrow('heading "নোটের শিরোনাম" is inside <Note>')
    const withHeading = exercise("এক").replace(
      "করে দেখো।",
      "### কাজের অংশ\n\nকরে দেখো।"
    )
    await expect(compileLesson(exercises(withHeading), draft)).rejects.toThrow(
      'heading "কাজের অংশ" is inside <Exercise>'
    )
  })
})
