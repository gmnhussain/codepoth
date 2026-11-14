# ADR-0006: URL scheme, topic keys and when a lesson id becomes permanent

- Status: accepted
- Date: 2026-11-14

## Context

Every page links to topics and lessons, so the URL scheme must be fixed before any page is built. The [content model](../content-model.md) says the URL slug comes from the file path and that lesson ids are permanent, but it does not say how a path becomes a URL, how a topic is identified, or when an id becomes permanent. The design keeps the group out of lesson URLs, and the design handoff identifies topics as `frontend/react`.

## Decision

### URLs

| Page   | URL                                                          |
| ------ | ------------------------------------------------------------ |
| Topic  | `/learn/[track]/[topic]`                                     |
| Lesson | `/learn/[track]/[topic]/[lesson]`                            |
| Others | `/roadmap`, `/contents`, `/glossary`, `/dashboard`, `/about` |

- A lesson's URL is its file path with the `tracks/` root, the group folder and the `.mdx` extension removed: `tracks/frontend/react/hooks/use-effect.mdx` → `/learn/frontend/react/use-effect`.
- The group is not part of the URL, so regrouping lessons never changes a link. Lesson file names must therefore be unique within a topic; the content-validation tests enforce it.
- An interchange topic has one URL, under its home track. Other tracks link to that URL.
- The `/learn` prefix keeps track folder names from colliding with the static routes.

### Topic keys

- A topic is identified by a path key, `track/topic` (e.g. `frontend/react`). It is used in code, in `map.json` and in URLs.
- A topic key is derived from the folder and changes when the folder moves. It is never stored in reader progress.
- Cross-track references in `order` keep the `@track/topic` syntax.
- Slash form = path-derived and may change. Dot form = a lesson's stable `id`.

### When a lesson id becomes permanent

- A lesson id becomes permanent when the lesson is first published (`draft: false`, see [ADR-0009](ADR-0009-lesson-blocks-and-content-fields.md)). Reader progress can only refer to published lessons, so nothing depends on a draft's id.
- While a lesson is a draft, its id may still change.

## Alternatives considered

- **Group in the URL** (`/learn/frontend/react/hooks/use-effect`). Rejected: regrouping would change URLs and need redirects for a purely organisational change.
- **No prefix** (`/frontend/react`). Rejected: a track folder could collide with a static route such as `/roadmap`.
- **Dot-style topic ids** (`frontend.react`). Rejected: they look like stable lesson ids, but topic keys are derived from folders and may change.
- **Stable topic ids in `_meta.json`.** Not needed yet: nothing stores topic-level reader data (see [ADR-0007](ADR-0007-reader-progress-shape.md)).

## Consequences

- Moving a lesson between groups keeps its URL. Moving it to another topic or track changes the URL, and `previousSlugs` turns the old path into a redirect ([ADR-0004](ADR-0004-vercel-ssg-not-static-export.md)).
- Moving a topic folder changes its key, so `map.json` and `@track/topic` references must change with it. The content-validation tests catch any that are missed.
- Reader data cannot be attached to a topic (e.g. a topic bookmark) without first giving topics stable ids.
