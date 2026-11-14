import type { Metadata } from "next"
import Link from "next/link"

import { formatNumber } from "@workspace/config/format"
import { t } from "@workspace/config/t"
import { buttonVariants } from "@workspace/ui/components/button"

/** HTTP status shown on the page. */
const NOT_FOUND_STATUS = 404

export const metadata: Metadata = {
  title: t("notFound.title"),
}

/**
 * Unknown URLs and every `dynamicParams = false` miss land here, inside the
 * site shell. Next.js adds `noindex` and sends 404. Links to more pages are
 * added as those pages exist (conventions §2).
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-5 px-4 py-24 sm:px-8">
      <p className="font-mono text-5xl font-semibold text-muted-foreground">
        {formatNumber(NOT_FOUND_STATUS)}
      </p>
      <h1 className="text-3xl font-semibold">{t("notFound.title")}</h1>
      <p className="leading-reading text-foreground/80">
        {t("notFound.description")}
      </p>
      <Link href="/" className={buttonVariants()}>
        {t("notFound.home")}
      </Link>
    </div>
  )
}
