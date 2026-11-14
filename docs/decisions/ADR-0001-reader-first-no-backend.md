# ADR-0001: Reader-first site, no login or backend in v1

- Status: accepted
- Date: 2026-11-13

## Context

The site doubles as the author's own learning book, but it is public. A personal-diary tone would make it less useful to readers, and accounts would add a backend, privacy obligations and cost before there is any content.

## Decision

- Every page is written for a public reader starting from zero. No author journey, no dev diary, no first-person tone.
- Progress, bookmarks and quiz scores belong to the reader and live in localStorage (`codepoth:v1`). No login.
- Content is MDX in this repo. The site is statically generated.

## Consequences

- Hosting is a static Vercel deploy with no runtime cost and no personal data.
- Progress does not sync across devices; export/import on the Dashboard covers that for now.
- Accounts and sync (PostgreSQL + Drizzle + Better Auth) can be added later without changing the content model, because progress is keyed by stable lesson IDs.
