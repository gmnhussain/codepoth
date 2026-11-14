"use client"

import "@workspace/ui/globals.css"
import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"

import { ErrorMessage } from "@/components/error-message"

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
        <title>{`${t("error.title")} · ${site.name.bn}`}</title>
        <ErrorMessage onRetry={retry} />
      </body>
    </html>
  )
}
