"use client"

import "@workspace/ui/globals.css"
import { lazy, Suspense } from "react"

// Loaded only when this page is shown: it carries the error labels, which
// would otherwise put the whole label set in every page's JavaScript
// (ADR-0013).
const GlobalErrorBody = lazy(() => import("@/components/global-error-body"))

/**
 * Shown when the root layout itself fails. It replaces the whole document,
 * so it brings its own html, body and styles; fonts and theme fall back to
 * the system ones (Next.js error.js docs).
 */
export default function GlobalError({
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <html lang="bn">
      <body>
        <Suspense fallback={null}>
          <GlobalErrorBody onRetry={retry} />
        </Suspense>
      </body>
    </html>
  )
}
