# Content model

**How content is organised on disk, how it is identified and validated, and what every lesson contains.**

Folder structure is the single source of truth. Never hardcode lists of tracks/topics/lessons in code.

The Zod schemas in `packages/content` are the authoritative definition of every shape below. This document explains them; if the two disagree, the schema wins and this file should be fixed. Content is loaded with Content Collections ([ADR-0005](decisions/ADR-0005-content-layer.md)): `packages/content/content-collections.ts` defines one collection per file type, `pnpm --filter @workspace/content content:generate` (turbo task `content:generate`) writes the typed data to `packages/content/.content-collections/generated/` (git-ignored), and apps import it from `@workspace/content/generated`. A file that fails its schema or path rules stops the `content:generate` step, and with it the build.

## Hierarchy

Track → Topic → [Group, optional] → Lesson → Section.

Code always uses these neutral names. Display terms (e.g. লাইন/স্টেশন vs পথ/ধাপ) come from the label config, never from code.

## Layout

```
content/
  _templates/
    lesson.mdx                # lesson template (see below)
  tracks/
    _meta.json                # { "order": ["cs", "lang", "tools", "frontend", …] }: track order
    frontend/                 # Track
      _meta.json              # { "title", "titleEn", "color", "order": ["html-css", "a11y", "@lang/javascript", "react", "nextjs"] }
      react/                  # Topic
        _meta.json            # { "title", "description", "start"?, "order": ["basics", "hooks", "advanced"], "prerequisites": [...] }
        hooks/                # Group (optional folder)
          _meta.json          # { "title", "description", "order": ["intro", "use-state", "use-effect"] }
          use-effect.mdx      # Lesson
      a11y/                   # Topic without groups: lessons sit directly inside
        _meta.json
        why-a11y.mdx
  glossary/                   # one file per term, e.g. side-effect.mdx
  map.json                    # map drawing: line polylines and topic coordinates
  start-routes.json           # Home's "where to start" routes
```

`content/` is plain files, not a workspace package. `packages/content` reads it at build time.

## Rules

- `tracks/_meta.json` lists every track folder exactly once. A track's number in the UI ("লাইন ৪") is its position in this list, computed, never stored.
- A topic is stored once, inside its home track. Another track that passes through it lists it in `order` as a reference (`"@lang/javascript"`). A topic that appears in 2+ tracks is an interchange.
- Every `order` array lists each child folder/file of its level exactly once, and nothing else (references excepted); the content-validation tests enforce it.
- In every `_meta.json` (track, topic, group), `title` is the Bangla display title. Technical names stay in English ("React").
- Track `_meta.json`: `titleEn` is required; the UI shows it as the track name with `title` as the Bangla subtitle. `color` is a hue from the track palette (`red`, `orange`, `amber`, `indigo`, `green`, `teal`, `purple`, `magenta`, `blue`, `brown`, `iris`, `lime`, `ink`, `pink`; see [ADR-0008](decisions/ADR-0008-design-tokens.md)), never a hex value. The track colour is the accent of every lesson page in that track.
- Topic `_meta.json`: `description` is required. Optional `start: true` marks a beginner entry topic (map flag and filter). Optional `titleEn` is used where an English name is needed.
- Group `_meta.json`: `description` is required.
- Groups are optional. Small topics have lessons directly. Never nest deeper than Track → Topic → Group → Lesson.
- Sections are the lesson's own `###` headings inside a block. Each block renders its own `h2`, so author headings start at `###`. They are not files. The right-side TOC is generated from them, nested under the lesson block they belong to. Each section's anchor comes from its text (`github-slugger`; Bangla letters are kept, e.g. `#তুলনা-কখন-কোনটা`), and renaming the heading changes the anchor ([ADR-0011](decisions/ADR-0011-mdx-compiled-at-build-time.md)).
- Small sub-topics (e.g. var/let/const) are Sections in one lesson. A sub-topic becomes its own Lesson only if it needs its own code, quiz, or > ~5 min of reading.

## URLs and keys

Details: [ADR-0006](decisions/ADR-0006-urls-and-content-keys.md).

- A lesson URL is its file path without the `tracks/` root, the group folder and `.mdx`: `tracks/frontend/react/hooks/use-effect.mdx` → `/learn/frontend/react/use-effect`. A topic URL is `/learn/[track]/[topic]`.
- Lesson file names are unique within a topic, because the group is not in the URL.
- A topic is identified by its path key `track/topic` (e.g. `frontend/react`), used in code and in `map.json`. It changes when the folder moves and is never stored in reader progress.
- Slash form = path-derived and may change. Dot form = a lesson's stable `id`.

## Stable IDs

Every lesson has an `id` in frontmatter, e.g. `frontend.react.hooks.use-effect`. Reader progress in localStorage is keyed by this id.

- The `id` is assigned when the lesson is created and becomes permanent when the lesson is first published (`draft: false`). While a lesson is a draft its id may still change, because no reader progress can refer to it.
- It is not derived from the file path, so after a move it may no longer match the folder it sits in. That is expected; never "fix" it.
- The URL slug is derived from the file path. Moving or renaming a file changes the URL but never the `id`.
- When a published lesson moves, add its old URL path to `previousSlugs` in frontmatter. The build turns every entry into a permanent redirect (`redirects()` in `next.config.ts`, see [ADR-0004](decisions/ADR-0004-vercel-ssg-not-static-export.md)), so old links and bookmarks keep working.
- IDs must be unique across all content; the content-validation tests enforce it.

## Drafts

- `draft: true` on a lesson or glossary entry keeps it out of production builds. Local and preview builds include drafts when `CONTENT_INCLUDE_DRAFTS=1` is set: in `apps/web/.env.local` locally (see `apps/web/.env.example`), and as a Vercel environment variable for Preview only. Any value other than `0` or `1` fails the build, and so does `CONTENT_INCLUDE_DRAFTS=1` on a production deploy (`VERCEL_ENV=production`, set by Vercel), so a mistaken setting can never publish drafts (`packages/content/src/env.ts`). With `.env.local` in place, a plain local `pnpm build` includes drafts; to check the production content locally, run `CONTENT_INCLUDE_DRAFTS=0 pnpm build` (a variable already set wins over `.env.local`).
- Validation always runs over every file, drafts included; only the published graph leaves drafts out.
- A build that includes drafts is never indexed by search engines ([conventions §12](development/conventions.md#12-public-site-and-seo)).
- Content copied from the design reference starts as a draft and is published only after the author reviews it.
- In a build without drafts, a topic with no published lessons has no page; the Map and Contents show it unlinked, marked as planned.
- Details: [ADR-0009](decisions/ADR-0009-lesson-blocks-and-content-fields.md).

## Lesson frontmatter

```yaml
---
id: frontend.react.hooks.use-effect
title: useEffect ও Side Effects
description: Render-এর পরে বাইরের দুনিয়ার সাথে কাজ করার জায়গা। # required unless draft: true
published: 2026-11-12 # required unless draft: true
updated: 2026-11-12
level: beginner # beginner | intermediate | advanced; required unless draft: true
draft: false # optional, default false
glossary: [side-effect, race-condition]
prerequisites: [frontend.react.hooks.use-state]
previousSlugs: [] # optional: old URL paths after a move, e.g. /learn/frontend/react/old-name
quiz: # 3–5 questions; required unless draft: true
  - question: useEffect(fn, []) কখন চলে?
    options:
      [
        প্রতিটা render-এর পরে,
        শুধু প্রথমবার mount হওয়ার পরে,
        render শুরু হওয়ার আগেই,
      ]
    answer: 1 # 0-based index into options
    explanation: খালি dependency array মানে effect শুধু প্রথম render-এর পরে একবার চলে।
  - question: নিচের effect চালালে কী হবে?
    code: | # optional code shown with the question
      useEffect(() => setCount(count + 1), [count])
    options: [একবার চলে থেমে যাবে, infinite loop হবে, কখনোই চলবে না]
    answer: 1
    explanation: প্রতিবার count বদলালে effect আবার চলে এবং count আবার বদলায়।
---
```

- Reading time is computed at build time, not written by hand: prose words ÷ a Bangla words-per-minute constant + code lines ÷ 10 per minute, rounded up, at least 1 minute.
- "নতুন / হালনাগাদ" tags and the "নতুন কী" list are computed at build time from `published` and `updated` (30-day window), so they are as fresh as the last build.
- Completeness rules apply only to published lessons (`draft` false): `description`, `level`, `published` and `quiz` are required, and so are the seven template blocks. A draft may be an incomplete stub. `updated` is never before `published`.
- Each quiz question has 2–4 options, a valid `answer` index and an `explanation`.
- Quiz text is plain text; the only markup is `backticks` for inline code, in the question, the options and the explanation (e.g. ``"`useEffect(fn, [])`"``; quote the YAML string). A longer snippet goes in `code`.

## Glossary entries

`content/glossary/<id>.mdx`, one file per term; the file name is the id used by `<Term id>` and `glossary`.

```yaml
---
term: Side effect # the term in English
termBn: সাইড ইফেক্ট # its Bangla name
track: frontend # track whose colour marks the term
draft: false # optional, default false
---
```

The MDX body is the definition, optionally followed by a code example. The lessons that use a term are computed (from `glossary` frontmatter), never written in the entry.

## Map

`content/map.json` draws the roadmap:

```json
{
  "width": 1400,
  "height": 880,
  "lines": { "frontend": "400,100 400,440" },
  "topics": { "frontend/react": { "x": 400, "y": 360, "label": "left" } }
}
```

- `lines`: track id → polyline points (`"x,y x,y …"`, at least two).
- `topics`: topic key → dot position inside the map and label side (`top`, `bottom`, `left`, `right`, `top-right`).

## Start routes

`content/start-routes.json` holds Home's "where to start" cards: `{ "routes": [{ "level", "title", "description", "steps": ["@track/topic" | { "label" }] }] }`. The list sits under `routes` because Content Collections needs an object at the root of a JSON file. Free labels are content, so they never use display terms such as লাইন/স্টেশন, which depend on the label set ([ADR-0003](decisions/ADR-0003-neutral-names-config-labels.md)). Every topic reference must resolve to an existing topic. A step whose topic has no published lesson renders like the Map: unlinked, marked as planned; it is not a build error. Home's main "start" button goes to the first published lesson along the routes (in route and step order); if no lesson is published yet, it links to `/roadmap`.

## Validation

Every content file is parsed with its Zod schema from `packages/content` at build time: lesson frontmatter, `_meta.json`, glossary entries, `map.json` and `start-routes.json`. Cross-file rules:

- Track, topic, group and lesson file names are lower-case kebab-case (they become URL segments).
- Lesson ids are unique; lesson file names are unique within a topic.
- `order` arrays match the folders exactly; every `@track/topic` reference resolves. A track lists its own topics by plain name, never as `@track/topic`.
- Every track, topic and group folder has its `_meta.json`; a name is never both a group folder and a lesson file in one topic.
- Every topic prerequisite (`@track/topic`) exists.
- Every `<Term id>` in a lesson and every entry in its `glossary` frontmatter exists in `content/glossary/`.
- Every `<Term id>` in a lesson body is also listed in its `glossary` frontmatter, because the glossary's "যে পাঠে আছে" list is built from the frontmatter.
- Every lesson id in `prerequisites` exists.
- No `published` or `updated` date is after the build date, taken in the site time zone (`site.timeZone`, Asia/Dhaka, where authors date their lessons), so a typo like 2027 cannot keep a lesson "new" for a year.
- Every glossary entry's `track` exists.
- A published lesson only references published content: its `<Term id>`, `glossary` and `prerequisites` entries must not point to drafts. The build fails otherwise.
- Every topic reference in `start-routes.json` resolves to an existing topic. A topic without published lessons is shown as planned, not rejected.
- `pnpm build` without `CONTENT_INCLUDE_DRAFTS` must pass when every lesson is a draft.
- Every track in `map.json` `lines` and every topic key in `topics` exists.
- Every topic has coordinates in `map.json`, and every track has a line. A missing one is a **warning** in `next dev` (the topic or track is left off the map) and an **error** in the content-validation test, locally and in CI.

The rules live in `packages/content/src/validate.ts`. `getContentGraph()` (`packages/content/src/content.ts`) runs them once per build and throws on any error, so every page that reads content fails the build on broken content; warnings are reported as Node.js warnings.

## Derived data

Computed at build time in `packages/content/src/graph.ts`, never written by hand: track numbers, topic and group entries in order, interchanges (topics on 2+ tracks), each lesson's URL and position in its topic and group, reading time per lesson, group and topic, previous/next lesson along the lesson's home track (flagging a new group or topic), the glossary reverse index (lessons per term), "new / updated" freshness and site counts (tracks, topics, lessons, quiz questions).

## Lesson template

Every lesson follows `content/_templates/lesson.mdx`. Each block is an MDX component, in this order:

| #   | Block                               | Component    | Notes                                                                |
| --- | ----------------------------------- | ------------ | -------------------------------------------------------------------- |
| 1   | Summary (এক নজরে / TL;DR)           | `<Summary>`  | 3 bullets; no block number                                           |
| 2   | Concept (ধারণা)                     | `<Concept>`  | prose, author sections (`###`), diagrams                             |
| 3   | Code (কোডে দেখি)                    | `<Example>`  | runnable, realistic example                                          |
| 4   | Common mistakes (সাধারণ ভুল)        | `<Mistakes>` | neutral tone ("অনেকেই প্রথমে…")                                      |
| 5   | Deep dive (গভীরে যাও)               | `<DeepDive>` | collapsible, closed by default, for experienced readers              |
| 6   | Practice with AI (AI দিয়ে অনুশীলন) | `<Practice>` | 2–3 copyable prompts that make the AI a tutor, not an answer machine |
| 7   | Quiz (কুইজ)                         | `<Quiz />`   | renders the frontmatter `quiz`                                       |
| 8   | Prev/next lesson                    | —            | generated, not written                                               |

- Lesson bodies are compiled at build time ([ADR-0011](decisions/ADR-0011-mdx-compiled-at-build-time.md)). In every lesson the build fails if a block is out of order or appears twice, if a `#`/`##` heading sits inside a block, or if a heading sits outside a block. A published lesson also fails if a block is missing or any content sits outside a block. Each `###` is tagged with the block it sits in, which gives the nested TOC. Block numbers (০১ …) are computed.
- Glossary terms are marked with `<Term id="side-effect">side effect</Term>`.

Writing style for lesson content: see [writing-guide.md](writing-guide.md).
