# ADR-0007: Shape of the reader progress in localStorage

- Status: accepted
- Date: 2026-11-14

## Context

The spec defines three lesson states: done, in progress (opened, not done) and not started. The first draft of the `codepoth:v1` shape stored only `done`, `doneAt` and a single `lastRead`, so "in progress" could not be stored for more than one lesson. The Dashboard in the design also needs a reading-day heatmap ("যেদিন পড়েছ", lessons per day) and the date each bookmark was saved ("সেভ গতকাল"). The Map design has a bookmark on topics.

No code reads or writes this storage yet, so the shape can change now without a migration.

## Decision

localStorage key: `codepoth:v1`. The version lives in the key; a future incompatible shape uses a new key (`codepoth:v2`) and migrates from the old one.

```ts
{
  lessons: {
    [lessonId: string]: {
      openedAt: string             // ISO timestamp, set on the first visit, never overwritten
      doneAt?: string              // ISO timestamp; present = done
      quiz?: { score: number; total: number; at: string } // latest attempt
    }
  },
  bookmarks: { [lessonId: string]: { at: string } },
  lastRead?: { id: string; at: string; anchor?: string },
  activity: { [localDate: string /* YYYY-MM-DD */]: string[] /* distinct lesson ids */ }
}
```

Rules:

- **Lesson state.** Done = the entry has `doneAt`. In progress = an entry without `doneAt`. Not started = no entry. The `done` boolean is removed.
- **Opening a lesson** creates the entry with `openedAt` if it does not exist and updates `lastRead`. `openedAt` is never overwritten.
- **Un-marking done** removes `doneAt` and keeps the entry, so the lesson goes back to "in progress".
- **Quiz** stores the latest attempt only.
- **Bookmarks** are a record keyed by lesson id: no duplicates, and the UI sorts them by `at`.
- **Activity.** On each local calendar day, the ids of the distinct lessons the reader opened, marked done or finished a quiz in. Reloading a page does not count twice. Only the last 140 days (the 20 weeks the heatmap shows) are kept; older days are pruned on write. The day is the reader's local date.
- **"শেষ সেভ" (last saved)** is the latest timestamp in the data. It is computed, not stored.
- **Unknown ids.** Entries for lesson ids that no longer exist in the content are kept (the lesson may come back) and ignored by the UI.
- **Reading.** Every read is validated with Zod. Invalid entries are dropped one by one; if the whole value is unreadable the store starts empty. A corrupt value never crashes a page.
- **Topics have no stored state.** Topic state is derived from its lessons. The Map design's topic bookmark is dropped, because topics have no stable id ([ADR-0006](ADR-0006-urls-and-content-keys.md)).
- **Export** downloads `{ format: "codepoth-progress", version: 1, exportedAt, data }`. **Import** validates the file with Zod, then asks the reader to **merge** (default) or **replace**. Merge keeps the earliest `openedAt`, the latest `doneAt` and the latest quiz attempt per lesson, the union of bookmarks (earliest `at`) and of activity, and the most recent `lastRead`.
- **Clear all** removes the key after a confirmation dialog.
- The data never leaves the browser ([ADR-0001](ADR-0001-reader-first-no-backend.md)).

## Alternatives considered

- **Keep `done` and add an `opened` list.** Rejected: two sources for one state that can disagree.
- **Activity as a count per day** (`{ [day]: number }`). Rejected: reloads and repeat visits inflate the count, and the heatmap shows lessons per day.
- **Derive activity from `openedAt`/`doneAt`/`quiz.at`.** Rejected: re-reading a finished lesson would not show as a reading day.
- **Bookmarks as `{ id, at }[]`.** Rejected: allows duplicates, and toggling needs a search.
- **Import that only replaces.** Rejected: importing on a second device that has its own progress would lose it.

## Consequences

- Each lesson's state comes from a single entry. The selectors (lesson, group, topic, track and overall state, next unfinished lesson, weakest quizzes, activity by day) are pure functions and are unit-tested.
- Storage grows with the number of lessons opened plus at most 140 days of activity, a few tens of kilobytes at most.
- A later account-based sync ([spec roadmap](../spec.md#roadmap-not-now)) can reuse the shape: every key is a stable lesson id and every date is ISO.
