# Writing guide

**How lesson and glossary content is written: for a reader starting from zero, in Bangla, in a neutral tone.**

Rules for lesson and glossary content. Structure, frontmatter and what the build checks are in [content-model.md](content-model.md#lesson-template); the template to copy is `content/_templates/lesson.mdx` ([ADR-0018](decisions/ADR-0018-lesson-template-v2.md)).

## Style

- Write for someone starting from zero; define every new term the first time and link it to the glossary with `<Term id="…">`.
- Short paragraphs, concrete examples, one idea per section. Prefer a diagram over a long paragraph.
- Bangla prose, English technical terms, code comments in Bangla where they help.
- Neutral, friendly tone. No first person about the author.

## Lesson parts

- **Goals:** 3–5 outcomes the reader can check, each ending in "…পারবে" ("useEffect দিয়ে data আনতে পারবে"). Name a skill, not a topic.
- **Concept:** prose and code interleaved, one `###` section per idea. Open with a familiar problem, analogy or question (a queue at a bank counter, a recipe), and only then name and define the topic: the concrete case first, the term second. Use the inline parts only where they help:
  - `<Note>` for background or a side remark, `<Tip>` for a practical habit, `<Pitfall>` for a trap the reader is likely to fall into right here.
  - `<Think>`: a question to stop and predict (an output, an order, a cause) before reading on, with one short `<Answer>` that says why.
  - `<DeepDive title="…">`: only for real internals, trade-offs or edge cases, next to the idea they explain. Not for content every reader needs.
- **Example:** only when the parts of the lesson need showing together in one real example. Say where to run it ("**কোথায় চালাবে:**") and what the reader will see ("**যা দেখবে:**").
- **Mistakes:** included by default; left out only when it would be filler (e.g. a first intro lesson with no real mistakes yet). Each item is symptom → why → fix:
  - **লক্ষণ:** what the reader sees, with the real error message where there is one (`TypeError: Assignment to constant variable.`).
  - **কেন:** the cause.
  - **ঠিক উপায়:** what to do instead.
  - Neutral tone: "অনেকেই প্রথমে…", never "আমি ভুল করেছিলাম…".
- **Summary:** 3–5 bullets that recap the lesson; the reader meets it after the content, not before.
- **Quiz:** every question has an explanation for the correct answer.
- **Exercises:** 2–4, from easy to harder (`level={1}` সহজ, `{2}` মাঝারি, `{3}` চ্যালেঞ্জ). Each gives a concrete task with starting code where it helps. Hints go from a nudge to almost the answer, each one shown only after the one before it, so the first hint never gives the solution away. The solution shows the code and says why it works.
- **Practice with AI:** included by default; left out only when it would be filler. The prompts make the AI a tutor (asks questions, gives hints), not an answer machine.
- **Resources:** optional, 1–5 links worth reading next; mark English pages with `lang: en`.
