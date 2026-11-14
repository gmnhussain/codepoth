import { site } from "@workspace/config/site"
import { activeNamespaces, t } from "@workspace/config/t"

import { ErrorMessage } from "@/components/error-message"
import { LabelsProvider } from "@/lib/labels-context"

/**
 * The body of `global-error.tsx`. That page replaces the root layout, so no
 * `LabelScope` is above it; this module brings its own labels instead and is
 * loaded lazily, only when the page is shown, so the label set it imports
 * never reaches First Load JS (ADR-0013).
 */
export default function GlobalErrorBody({
  onRetry,
}: {
  readonly onRetry: () => void
}) {
  return (
    <LabelsProvider labels={activeNamespaces(["error"])}>
      <title>{`${t("error.title")} · ${site.name.bn}`}</title>
      <ErrorMessage onRetry={onRetry} />
    </LabelsProvider>
  )
}
