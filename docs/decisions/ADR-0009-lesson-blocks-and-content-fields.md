# ADR-0009: Lesson blocks, quiz data, drafts and new content fields

- Status: accepted
- Date: 2026-11-14

## Context

The design needs data the [content model](../content-model.md) does not have yet:

- Home shows "নতুন / হালনাগাদ" tags, a "নতুন কী" list, the number of quiz questions, and three "কোথা থেকে শুরু করবে?" routes.
- The Map flags beginner entry topics ("শুরু এখান থেকে") and shows a description for every topic.
- Tracks show an English name with a Bangla subtitle.
- The lesson TOC nests the author's `##`/`###` headings under the template block they sit in, but Concept and Code are plain prose, so their boundaries are unknown.
- The quiz needs structured data (counted at build time, validated as 3–5 MCQs with explanations).

Separately, the curriculum skeleton and the design's sample lessons are needed during development, but unreviewed lessons must not be published, and the site has no placeholder pages ([conventions §2](../development/conventions.md#2-working-rules-people-and-ai-agents)).

## Decision

### Lesson template blocks

- All seven template blocks are MDX components, in this order: `<Summary>`, `<Concept>`, `<Example>`, `<Mistakes>`, `<DeepDive>`, `<Practice>`, `<Quiz />`. Prev/next is generated.
- At build time each heading is tagged with the block it sits in, which gives the nested TOC. The build fails if blocks are out of order, or, in a published lesson, missing.
- Block numbers (০১ …) are computed from the order. The Summary has no number.

### Quiz data in frontmatter

```yaml
quiz:
  - question: useEffect(fn, []) কখন চলে?
    code: | # optional
      useEffect(() => {}, [])
    options:
      [
        প্রতিটা render-এর পরে,
        শুধু প্রথমবার mount হওয়ার পরে,
        render শুরু হওয়ার আগেই,
      ]
    answer: 1 # 0-based index into options
    explanation: খালি dependency array মানে effect শুধু প্রথম render-এর পরে একবার চলে।
```

- 3–5 questions; 2–4 options each; `answer` is a valid index; `explanation` is required.
- `<Quiz />` in the body marks where the quiz renders.

### New and tightened fields

| Where              | Field         | Rule                                                                            |
| ------------------ | ------------- | ------------------------------------------------------------------------------- |
| Lesson frontmatter | `published`   | Date of first publication. Required when `draft` is false; drafts may omit it.  |
| Lesson frontmatter | `draft`       | Optional boolean, default `false`.                                              |
| Lesson frontmatter | `quiz`        | As above. Required when `draft` is false; drafts may omit it.                   |
| Glossary entry     | `draft`       | Optional boolean, default `false`.                                              |
| Track `_meta.json` | `titleEn`     | Required. The UI shows it as the track name and `title` as the Bangla subtitle. |
| Track `_meta.json` | `color`       | A hue from the palette ([ADR-0008](ADR-0008-design-tokens.md)).                 |
| Topic `_meta.json` | `description` | Required.                                                                       |
| Topic `_meta.json` | `start`       | Optional `true`: a beginner entry topic (map flag and filter).                  |
| Group `_meta.json` | `description` | Required.                                                                       |

- **"নতুন / হালনাগাদ".** A lesson is "নতুন" if `published` is within the last 30 days, else "হালনাগাদ" if `updated` is. "নতুন কী" lists the 5 lessons with the most recent `max(published, updated)`. Both are computed at build time, so they are only as fresh as the last build.

### Track order

`content/tracks/_meta.json` holds `{ "order": [...] }` with every track folder exactly once, the same order-array pattern as every other level. A track's number in the UI ("লাইন ১") is its position in this list, computed, never stored.

### Start routes

`content/start-routes.json` holds Home's "where to start" cards. They are editorial content, not code:

```json
{
  "routes": [
    {
      "level": "…",
      "title": "…",
      "description": "…",
      "steps": ["@frontend/html-css", "@cs/binary-logic", { "label": "…" }]
    }
  ]
}
```

- A step is a topic reference or a free label. Every reference must resolve.
- A step whose topic has no published lesson renders like the Map: unlinked, marked as planned. It is not a build error, but the reference must still resolve to an existing topic.
- Home's main "শুরু করো" button goes to the first published lesson along the routes (in route and step order). If no lesson is published yet, it links to `/roadmap`.

### Drafts

- A lesson or glossary entry with `draft: true` is excluded from production builds. A production deploy (`VERCEL_ENV=production`) refuses `CONTENT_INCLUDE_DRAFTS=1` and fails the build, so drafts cannot reach readers through a mistaken setting. Local and preview builds include drafts when `CONTENT_INCLUDE_DRAFTS=1` is set; the variable is declared in the env schema and `.env.example`.
- A published lesson only references published content. The build fails if its `<Term id>`, `glossary` or `prerequisites` entry points to a draft. Every lesson id in `prerequisites` must exist.
- `pnpm build` without `CONTENT_INCLUDE_DRAFTS` must pass when every lesson is a draft (as it is right after the seed content lands).
- Completeness rules apply only to published lessons: `description`, `level`, `published`, `quiz` and the seven template blocks are required when `draft` is false. A draft may be an incomplete stub (`id`, `title` and `updated` only), so seed stubs need no invented descriptions, levels or quizzes.
- A lesson id becomes permanent only when the lesson is first published ([ADR-0006](ADR-0006-urls-and-content-keys.md)).
- All seed content copied from the design (sample lessons, stub lessons and glossary terms) starts as `draft: true` and is published only after the author reviews it.
- The curriculum skeleton (tracks, topics, groups and `map.json`) is published content. In a build without drafts, a topic with no published lessons gets no page. It still appears on the Map and in Contents, unlinked and marked as planned, because the roadmap is the curriculum plan.

### Reading time

Reading time = prose words ÷ a documented Bangla words-per-minute constant (initially 150) + code lines ÷ 10 per minute, rounded up, at least 1 minute. Group, topic and track times are sums.

## Alternatives considered

- **Quiz as MDX children.** Rejected: questions cannot be counted or validated without parsing the MDX tree, and the shape would be checked only at render time.
- **Only Summary, Mistakes, DeepDive, Practice and Quiz as components.** Rejected: the TOC could not tell where Concept ends and Code begins.
- **Start routes in `packages/config`.** Rejected: a hard-coded list of topics in code or config.
- **Seed content as test fixtures only.** Rejected: pages need realistic content during development, and the curriculum skeleton is real content.
- **Hide topics without published lessons.** Rejected: the map would not show the curriculum plan, and lines would break apart.

## Consequences

- Writing a lesson is more structured: seven wrapper components and quiz frontmatter. The lesson template shows a complete example.
- Home statistics (tracks, topics, lessons, quiz questions) are computed exactly.
- Every published page has real content. Drafts never reach production by accident, because including them needs an explicit flag.
- "Planned" topics need one extra label in each label set.
