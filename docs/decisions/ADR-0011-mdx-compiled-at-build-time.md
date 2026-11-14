# ADR-0011: MDX compiled at build time, with the lesson structure checked

- Status: accepted
- Date: 2026-11-14
- Details: [ADR-0005](ADR-0005-content-layer.md) (MDX compiled inside the collection transform)

## Context

ADR-0005 left the details of MDX compilation to the lesson page. Lesson pages need the template blocks in order (ADR-0009), a TOC that nests the author's sections under their block, stable heading anchors, and highlighted code, all without shipping an MDX compiler or a highlighter to the browser.

## Decision

- The Content Collections transform compiles every lesson and glossary body with `@mdx-js/mdx` (`outputFormat: "function-body"`), `remark-gfm` and `rehype-pretty-code` + Shiki ([ADR-0010](ADR-0010-dark-code-blocks.md)). The compiled code is stored on the document as `mdx`. Apps render it in a Server Component with `run()` and the React JSX runtime.
- A remark step (`packages/content/src/mdx/blocks.ts`) checks the lesson structure and records the sections:
  - Every lesson: blocks in the template order, none twice; no `##` or `#` inside a block (blocks render `h2`); no heading outside a block.
  - Published lessons also: all seven blocks present, and no content outside a block.
  - Each `###` gets an id from `github-slugger` (Bangla letters are kept; the block ids are reserved, so a section called "Summary" becomes `summary-1`). The list `{ id, title, block }` is stored on the lesson as `sections`.
- A broken lesson fails `content:generate`, and with it the build.

## Alternatives considered

- **`@next/mdx` with dynamic imports.** Rejected: Turbopack only accepts plugins with serialisable options, and the block check needs to report sections back to the content data.
- **`@content-collections/mdx`.** Rejected in ADR-0005 (last release 2025-03, built on `mdx-bundler`).
- **Positional heading ids** (`concept-1`). Rejected: they change when a section is inserted; text-based ids are what readers see in a shared link.

## Consequences

- Pages get the TOC, block numbers and anchors from build-time data; nothing is parsed in the browser.
- Renaming a `###` heading changes its anchor. Saved reading positions that point to it (Phase 3) fall back to the top of the lesson.
- The compiled bodies make the generated content larger (about 40 KB per full lesson); they are only loaded on the server during the build.
