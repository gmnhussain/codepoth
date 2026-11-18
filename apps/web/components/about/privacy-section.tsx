import type { ReactNode } from "react"

import { t } from "@workspace/config/t"

/**
 * `<Privacy>` in `content/pages/about.mdx`: the privacy prose as the
 * `#privacy` section, the target of the footer's link. The content layer
 * guarantees exactly one per page (ADR-0012).
 */
export function PrivacySection({
  children,
}: {
  readonly children?: ReactNode
}) {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border bg-card p-7 target:ring-2 target:ring-foreground"
    >
      <h2 id="privacy-heading" className="text-2xl font-semibold">
        {t("about.privacyHeading")}
      </h2>
      {children}
    </section>
  )
}
