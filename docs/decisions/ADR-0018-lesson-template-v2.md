# ADR-0018: Lesson template v2: goals, resources, inline components and exercises

- Status: accepted
- Date: 2026-11-21
- Supersedes: the "Lesson template blocks" section of [ADR-0009](ADR-0009-lesson-blocks-and-content-fields.md), and the block list and completeness rule of [ADR-0011](ADR-0011-mdx-compiled-at-build-time.md) ("all seven blocks present").
- Amends: the "Reading time" section of ADR-0009 (see [Reading time](#reading-time)). The rest of both records stands.

## Context

The first template (ADR-0009) has seven fixed blocks: Summary first, then Concept, Example, Mistakes, a Deep dive block, AI practice and the quiz. Every block is required in a published lesson, and every block after the summary carries a number (০১ …). Reviewing the template against established tutorial sites (react.dev, javascript.info, MDN Learn, The Odin Project) and against the two lessons written in it showed these gaps:

- A reader does not see what the lesson will teach before reading it. A summary at the top is more useful as a recap at the end.
- Internals and edge cases belong next to the idea they explain, not in a separate block at the end that most readers skip.
- The lesson has no place for the reader to do something: no "think before you read on" questions, no exercises with hints and a solution.
- Example, Mistakes and Practice are not useful in every lesson (a first intro lesson has no real mistakes yet), so requiring them invites filler.
- Further reading has no place, and block numbers add noise without helping navigation.

## Decision

### Frontmatter

| Field       | Rule                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `goals`     | 3–5 short outcomes ("…পারবে"). Required unless `draft` is true. Rendered in the lesson header under "এই পাঠে শিখবে".                                          |
| `resources` | Optional, 1–5 items `{ title, url, lang? }`. `url` is https; `lang` is `bn` or `en`, and `en` shows a marker. Rendered after the last block under "আরও পড়ো". |

There is no `kind` field and no project template; both are deferred until a project lesson is written.

### Blocks

The blocks, in this fixed order. Optional blocks may be left out; no block may appear twice; in a published lesson no content sits outside a block.

| #   | Block     | Component     | Required | Notes                                                                                      |
| --- | --------- | ------------- | -------- | ------------------------------------------------------------------------------------------ |
| 1   | Concept   | `<Concept>`   | yes      | prose and code interleaved, `###` sections; the only block with inline teaching components |
| 2   | Example   | `<Example>`   | no       | one complete, realistic example: where to run it and what you will see                     |
| 3   | Mistakes  | `<Mistakes>`  | no       | each item: symptom (the real error message where there is one) → why → fix                 |
| 4   | Summary   | `<Summary>`   | yes      | moved from the top; same component and label; 3–5 bullets (a writing rule, not enforced)   |
| 5   | Quiz      | `<Quiz />`    | yes      | unchanged                                                                                  |
| 6   | Exercises | `<Exercises>` | yes      | 2–4 `<Exercise>`                                                                           |
| 7   | Practice  | `<Practice>`  | no       | AI practice prompts, unchanged otherwise                                                   |

Resources and prev/next follow, generated. The Deep dive block is gone; DeepDive is now an inline component. Blocks have no numbers.

### Components inside blocks

| Component                                  | Where                           | Rules                                                                                       |
| ------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `<Note>`, `<Tip>`, `<Pitfall>`, `<Steps>`  | inside Concept                  |                                                                                             |
| `<Think>`                                  | inside Concept                  | a question with exactly one `<Answer>` as its last child; the answer is collapsed           |
| `<DeepDive title="…" hint?="…">`           | inside Concept                  | collapsed; may appear several times                                                         |
| `<Exercise title="…" level={1 \| 2 \| 3}>` | direct child of `<Exercises>`   | the task, then ≥1 `<Hint>`, then exactly one `<Solution>` (last)                            |
| `<Hint>`, `<Solution>`                     | direct children of `<Exercise>` | hints open one at a time, in order; the solution is collapsed and never waits for the hints |
| `<Term id="…">`                            | any block                       | a glossary link, not a teaching device                                                      |

- A collapsible (Think, DeepDive) never sits inside another collapsible. Any other component name fails the build.
- No heading (`#`, `##`, `###`) inside an inline component, so no TOC entry can point into a closed `<details>`.
- Rules split in two. **Shape** errors fail every lesson, drafts included: order, repeats, a component in the wrong place, too many of something, a bad attribute, a heading inside an inline component. **Missing** things fail only a published lesson: a required block, `goals`, fewer than two exercises, an exercise without a hint or solution, a Think without its answer. A draft in progress, or an empty stub, still builds.

### Page

- Every collapsible (Think's answer, DeepDive, Hint, Solution) is a native `<details>`, rendered on the server; no client JavaScript is added. Hints are shown in order with CSS only: a hint appears once the one before it is open. The solution sits outside that group.
- The TOC lists the blocks the lesson has (no numbers) with their `###` sections, then "আরও পড়ো" when there are resources, then prev/next. Inline DeepDives, Think questions and single exercises are not in the TOC. Exercise titles are `h3` without an id.
- Search ([ADR-0015](ADR-0015-site-search-with-pagefind.md)): answers, hints and solutions are left out of the index, so a search excerpt never gives away an exercise; so is the resources list (other sites' titles). DeepDive text, Think questions, exercise tasks and goals are indexed. ADR-0015's note about section numbers no longer applies, because there are none.

### Reading time

Reading time follows ADR-0009, except that the text and code inside `<Answer>`, `<Hint>` and `<Solution>` are not counted: a reader who solves an exercise alone never reads them. DeepDive text and exercise tasks still count.

## Alternatives considered

- **Keep the Deep dive block at the end.** Rejected: internals read best next to the idea they explain, and a closed block at the end is mostly skipped.
- **Exercises in frontmatter, like the quiz.** Rejected: tasks, hints and solutions need code blocks and prose; YAML is a poor place to write them, and nothing needs to count them across the site.
- **A `kind` field and a project template.** Deferred: no project lesson exists yet to design it from.
- **A client-side hint stepper.** Rejected: CSS on native `<details>` shows hints in order with no JavaScript.
- **Keep every block required.** Rejected: it forces filler sections in lessons where they do not fit.
- **Keep block numbers.** Rejected: with optional blocks the numbers change from lesson to lesson and add no navigation value.

## Consequences

- A lesson states its goals up front, recaps at the end and asks the reader to practise; writing one takes more work (exercises with hints and solutions).
- Content validation knows every lesson component, so a typo in a component name fails `content:generate` instead of the prerender.
- Lessons in the old order fail the build until migrated; at the time of this decision every lesson is a draft, and only two have content.
- A reader's saved section id that pointed into the removed Deep dive block no longer matches a section; the resume link opens the top of the lesson, as after a renamed heading (ADR-0011).
- Reader progress (`codepoth:v1`) is unchanged.
