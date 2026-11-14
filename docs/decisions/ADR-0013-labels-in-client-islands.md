# ADR-0013: Client islands get only the label groups they use

- Status: accepted
- Date: 2026-11-15
- Details: [ADR-0003](ADR-0003-neutral-names-config-labels.md) (labels and `t()`), [performance.md](../development/performance.md) (client islands)

## Context

`t()` binds the whole active label set. Any client component that imported it pulled the entire set (17 KB raw, about 4.2 KB gzip) into the shared client chunk, so every route paid for every page's copy, and the cost grew with each page.

## Decision

- `@workspace/config/translate` holds the translator without any label strings: `createTranslator`, `pickNamespaces` and `Translate<K>`, a `t()` that accepts only keys under the groups `K`. `@workspace/config/t` binds it to the active set and is for server code only.
- A server component, `LabelScope` (`apps/web/components/label-scope.tsx`), picks the top-level label groups a part of the page needs and hands them to a client `LabelsProvider` (`apps/web/lib/labels-context.tsx`). Scopes nest; groups add up.
- Each client component declares its groups: `useT(["quiz"])`. Two checks follow from that:
  - **Typecheck:** the returned `t` is a `Translate<"quiz">`, so a key outside the declared groups does not compile. No cast widens it.
  - **Every render:** `useT` checks that each declared group is in scope and throws, naming the group, if one is missing. Every page is prerendered, so a page that forgets a group fails the build even when the group's strings appear only after an interaction (quiz feedback, "কপি হয়েছে", a popover's content).
  - The root layout scopes `common`, `theme`, `nav` and `error` (the shell's islands and `error.tsx`).
  - Pages scope what their islands use: lessons `lesson`, `copy`, `quiz`, `term`; Contents `contents`; Glossary `glossary`, `copy`; the roadmap `roadmap`, `lesson`, `topic`.
- Components rendered both on the server and in an island (`LessonRow`, `RoadmapCanvas`) take `t` as a prop typed with the groups they use (`Translate<"topic">`): the server passes `t`, which fits any `Translate<K>`, and an island passes its `useT(...)`, which must declare those groups.
- `global-error.tsx` replaces the root layout, so no scope is above it. Its body is loaded lazily and brings the error group itself; the full set it imports sits in that lazy chunk only.
- An ESLint rule (`apps/web/eslint.config.js`) fails any `"use client"` file that imports `@workspace/config/t`.

## Alternatives considered

- **Each island's strings as props from the page.** Rejected: long prop lists, and strings with values (`{n}টি পাঠ মিলেছে`) need the translator on the client anyway.
- **One label file per group.** Rejected for now: it changes the label-set files and their parity test for the same result.
- **Leave it.** Rejected: about 4.4 KB gzip on every route, growing with each page.

## Consequences

- First Load JS dropped by about 4.4–4.5 KB gzip on every route; the labels a page needs (0.4–1.3 KB gzip) travel as data in its HTML.
- A new client component calls `useT([...its groups])`, and its page (or the layout) scopes them; typecheck, the prerender or lint says so if either side is missing.
