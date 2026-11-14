# Content model

**How content is organised on disk, how it is identified and validated, and what every lesson contains.**

Folder structure is the single source of truth. Never hardcode lists of tracks/topics/lessons in code.

The Zod schemas in `packages/content` are the authoritative definition of every shape below. This document explains them; if the two disagree, the schema wins and this file should be fixed.

## Hierarchy

Track → Topic → [Group, optional] → Lesson → Section.

Code always uses these neutral names. Display terms (e.g. লাইন/স্টেশন vs পথ/ধাপ) come from the label config, never from code.

## Layout

```
content/
  _templates/
    lesson.mdx                # lesson template (see below)
  tracks/
    frontend/                 # Track
      _meta.json              # { "title", "titleEn", "color", "order": ["html", "a11y", "@lang/js", "react", "next"] }
      react/                  # Topic
        _meta.json            # { "title", "titleEn", "description", "order": ["basics", "hooks", "advanced"], "prerequisites": [...] }
        hooks/                # Group (optional folder)
          _meta.json          # { "title", "titleEn", "description", "order": ["intro", "use-state", "use-effect"] }
          use-effect.mdx      # Lesson
      a11y/                   # Topic without groups: lessons sit directly inside
        _meta.json
        why-a11y.mdx
  glossary/                   # one file per term, e.g. side-effect.mdx
  map.json                    # map drawing: line polylines and topic coordinates
```

`content/` is plain files, not a workspace package. `packages/content` reads it at build time.

## Rules

- A topic is stored once, inside its home track. Another track that passes through it lists it in `order` as a reference (`"@lang/js"`). A topic that appears in 2+ tracks is an interchange.
- In every `_meta.json` (track, topic, group), `title` is the Bangla display title. `titleEn` is optional and used where an English name is needed (Open Graph, map labels).
- Groups are optional. Small topics have lessons directly. Never nest deeper than Track → Topic → Group → Lesson.
- Sections are the lesson's own `##`/`###` headings. They are not files. The right-side TOC is generated from them, nested under the lesson block they belong to.
- Small sub-topics (e.g. var/let/const) are Sections in one lesson. A sub-topic becomes its own Lesson only if it needs its own code, quiz, or > ~5 min of reading.

## Stable IDs

Every lesson has a permanent `id` in frontmatter, e.g. `frontend.react.hooks.use-effect`. Reader progress in localStorage is keyed by this id.

- The `id` is assigned once, when the lesson is created. It is not derived from the file path, so after a move it may no longer match the folder it sits in. That is expected; never "fix" it.
- The URL slug is derived from the file path. Moving or renaming a file changes the URL but never the `id`.
- When a lesson moves, add its old URL path to `previousSlugs` in frontmatter. The build turns every entry into a permanent redirect (`redirects()` in `next.config.ts`, see [ADR-0004](decisions/ADR-0004-vercel-ssg-not-static-export.md)), so old links and bookmarks keep working.
- IDs must be unique across all content; the content-validation tests enforce it.

## Lesson frontmatter

```yaml
---
id: frontend.react.hooks.use-effect
title: useEffect ও Side Effects
description: Render-এর পরে বাইরের দুনিয়ার সাথে কাজ করার জায়গা।
updated: 2026-11-11
level: beginner # beginner | intermediate | advanced
glossary: [side-effect, race-condition]
prerequisites: [frontend.react.hooks.use-state]
previousSlugs: [] # optional: old URL paths after a move
---
```

Reading time is computed at build time, not written by hand.

## Validation

Every content file is parsed with its Zod schema from `packages/content` at build time: lesson frontmatter, `_meta.json`, glossary entries and `map.json`. Cross-file rules:

- Every `<Term id>` in a lesson and every entry in its `glossary` frontmatter exists in `content/glossary/`.
- Every topic has coordinates in `map.json`. A missing one is a **warning** while developing (the topic is left off the map) and an **error** in CI (the content-validation test fails).

## Lesson template

Every lesson follows `content/_templates/lesson.mdx`. Block order:

1. Summary (এক নজরে / TL;DR) — 3 bullets
2. Concept (ধারণা) — prose, author sections (`##`), diagrams
3. Code (কোডে দেখি) — runnable, realistic example
4. Common mistakes (সাধারণ ভুল) — neutral tone ("অনেকেই প্রথমে…")
5. Deep dive (গভীরে যাও / আরও গভীরে) — collapsible, closed by default, for experienced readers
6. Practice with AI (AI দিয়ে অনুশীলন) — 2–3 copyable prompts that make the AI a tutor, not an answer machine
7. Quiz (কুইজ / নিজেকে যাচাই) — 3–5 MCQs, each with an explanation
8. Prev/next lesson — generated, not written

Blocks 1, 4, 5, 6, 7 are MDX components: `<Summary>`, `<Mistakes>`, `<DeepDive>`, `<Practice>`, `<Quiz>`. Glossary terms are marked with `<Term id="side-effect">side effect</Term>`.

Writing style for lesson content: see [writing-guide.md](writing-guide.md).
