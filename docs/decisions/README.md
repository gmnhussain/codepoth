# Architecture decision records

**Each hard-to-reverse decision is recorded once here, with its context and consequences, and is superseded rather than edited.**

One file per decision: `ADR-NNNN-<kebab-title>.md`. Never edit an accepted decision's reasoning; supersede it with a new record instead.

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

| #                                                    | Decision                                       | Status   |
| ---------------------------------------------------- | ---------------------------------------------- | -------- |
| [ADR-0001](ADR-0001-reader-first-no-backend.md)      | Reader-first site, no login/backend in v1      | accepted |
| [ADR-0002](ADR-0002-folder-is-source-of-truth.md)    | Folder structure + stable IDs for content      | accepted |
| [ADR-0003](ADR-0003-neutral-names-config-labels.md)  | Neutral code names, display terms in config    | accepted |
| [ADR-0004](ADR-0004-vercel-ssg-not-static-export.md) | Static generation on Vercel, not static export | accepted |

## Open questions (do NOT hardcode)

- Display terminology (লাইন/স্টেশন vs পথ/ধাপ).
- Site name and logo.
- Content layer: Velite vs Content Collections.
