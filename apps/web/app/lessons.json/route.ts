import { getContentGraph } from "@workspace/content/content"

import { resumeIndexOf } from "@/lib/progress/resume-index"

// Prerendered at build time into a static file (ADR-0004): no request data,
// the same content graph (and draft rule) as the pages.
export const dynamic = "force-static"

/**
 * `/lessons.json`: the lesson index Home fetches to resume a returning
 * reader's last-read lesson (lib/progress/resume.ts). First-time visitors
 * never request it.
 */
export function GET(): Response {
  return Response.json(resumeIndexOf(getContentGraph()))
}
