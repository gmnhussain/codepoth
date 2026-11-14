# ADR-0002: Folder structure is the source of truth; lessons have stable IDs

- Status: accepted
- Date: 2026-11-13

## Context

The curriculum will grow and be reorganised often. Hardcoded lists in code drift from the files, and reader progress must survive files being moved or renamed.

## Decision

- Hierarchy is Track → Topic → [Group, optional] → Lesson → Section, expressed as folders and `_meta.json` `order` arrays.
- A topic lives once in its home track; other tracks reference it (`"@lang/js"`), making it an interchange.
- Every lesson has a permanent frontmatter `id`. Progress is keyed by it, and it never changes when a file moves.

## Consequences

- No list of tracks/topics/lessons in code; everything is derived at build time and validated with Zod.
- Changing an existing lesson `id` breaks reader progress and requires explicit approval.
- Details: [../content-model.md](../content-model.md).
