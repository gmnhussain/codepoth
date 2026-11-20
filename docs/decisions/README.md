# Architecture decision records

**Each hard-to-reverse decision is recorded once here, with its context and consequences, and is superseded rather than edited once it is merged into `main`.**

One file per decision: `ADR-NNNN-<kebab-title>.md`. A record can still be edited until its branch is merged into `main`; after that, never edit it, supersede it with a new record ([conventions §4](../development/conventions.md#4-documentation)).

Template:

```md
# ADR-NNNN: Title

- Status: proposed | accepted | superseded by ADR-NNNN
- Date: YYYY-MM-DD

## Context

What problem or question forced a decision.

## Decision

What we chose.

## Alternatives considered

Each option that was rejected, and why.

## Consequences

What becomes easier or harder because of it.
```

## Index

| #                                                             | Decision                                                            | Status                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| [ADR-0001](ADR-0001-reader-first-no-backend.md)               | Reader-first site, no login/backend in v1                           | accepted                                                        |
| [ADR-0002](ADR-0002-folder-is-source-of-truth.md)             | Folder structure + stable IDs for content                           | accepted                                                        |
| [ADR-0003](ADR-0003-neutral-names-config-labels.md)           | Neutral code names, display terms in config                         | accepted                                                        |
| [ADR-0004](ADR-0004-vercel-ssg-not-static-export.md)          | Static generation on Vercel, not static export                      | accepted                                                        |
| [ADR-0005](ADR-0005-content-layer.md)                         | Content Collections as the content layer                            | accepted                                                        |
| [ADR-0006](ADR-0006-urls-and-content-keys.md)                 | URL scheme, topic keys, permanent lesson ids                        | accepted                                                        |
| [ADR-0007](ADR-0007-reader-progress-shape.md)                 | Shape of the reader progress in localStorage                        | accepted                                                        |
| [ADR-0008](ADR-0008-design-tokens.md)                         | Design tokens, track colours and type scale                         | accepted                                                        |
| [ADR-0009](ADR-0009-lesson-blocks-and-content-fields.md)      | Lesson blocks, quiz data, drafts, new fields                        | accepted; blocks superseded, reading time amended by ADR-0018   |
| [ADR-0010](ADR-0010-dark-code-blocks.md)                      | Dark code blocks with one Shiki theme (amends ADR-0008)             | accepted                                                        |
| [ADR-0011](ADR-0011-mdx-compiled-at-build-time.md)            | MDX compiled at build time, structure checked                       | accepted; required-block list superseded by ADR-0018            |
| [ADR-0012](ADR-0012-about-page-content.md)                    | About page as content, privacy text kept true                       | accepted                                                        |
| [ADR-0013](ADR-0013-labels-in-client-islands.md)              | Client islands get only the label groups they use                   | accepted                                                        |
| [ADR-0014](ADR-0014-reader-progress-implementation.md)        | How reader progress is built in the web app                         | accepted                                                        |
| [ADR-0015](ADR-0015-site-search-with-pagefind.md)             | Site search with Pagefind over the pre-rendered pages               | accepted; build and "Not verified" parts superseded by ADR-0016 |
| [ADR-0016](ADR-0016-search-index-built-in-a-build-adapter.md) | Search index built in a build adapter (supersedes part of ADR-0015) | accepted                                                        |
| [ADR-0017](ADR-0017-one-font-for-text-and-headings.md)        | One font for text and headings; width-matched Bangla digits face    | accepted                                                        |
| [ADR-0018](ADR-0018-lesson-template-v2.md)                    | Lesson template v2 (supersedes part of ADR-0009 and ADR-0011)       | accepted                                                        |

## Open questions (do NOT hardcode)

- Display terminology (লাইন/স্টেশন vs পথ/ধাপ).
- Site name and logo.
