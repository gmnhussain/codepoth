"use client"

import { ErrorMessage } from "@/components/error-message"

/** Shown when a page fails while rendering; the site shell stays (conventions §10). */
export default function ErrorPage({
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return <ErrorMessage onRetry={retry} />
}
