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

| #                                                        | Decision                                       | Status   |
| -------------------------------------------------------- | ---------------------------------------------- | -------- |
| [ADR-0001](ADR-0001-reader-first-no-backend.md)          | Reader-first site, no login/backend in v1      | accepted |
| [ADR-0002](ADR-0002-folder-is-source-of-truth.md)        | Folder structure + stable IDs for content      | accepted |
| [ADR-0003](ADR-0003-neutral-names-config-labels.md)      | Neutral code names, display terms in config    | accepted |
| [ADR-0004](ADR-0004-vercel-ssg-not-static-export.md)     | Static generation on Vercel, not static export | accepted |
| [ADR-0005](ADR-0005-content-layer.md)                    | Content Collections as the content layer       | accepted |
| [ADR-0006](ADR-0006-urls-and-content-keys.md)            | URL scheme, topic keys, permanent lesson ids   | accepted |
| [ADR-0007](ADR-0007-reader-progress-shape.md)            | Shape of the reader progress in localStorage   | accepted |
| [ADR-0008](ADR-0008-design-tokens.md)                    | Design tokens, track colours and type scale    | accepted |
| [ADR-0009](ADR-0009-lesson-blocks-and-content-fields.md) | Lesson blocks, quiz data, drafts, new fields   | accepted |

## Open questions (do NOT hardcode)

- Display terminology (লাইন/স্টেশন vs পথ/ধাপ).
- Site name and logo.
