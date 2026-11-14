import Link from "next/link"

import { Logo } from "@workspace/config/logo"
import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"

/** Logo, site name and English tag, linking home. Used in header and footer. */
export function BrandLink() {
  return (
    <Link
      href="/"
      aria-label={t("site.homeLink", { name: site.name.bn })}
      className="flex min-h-11 shrink-0 items-center gap-2.5 self-start rounded-lg"
    >
      <Logo className="size-7" />
      <span className="font-heading text-2xl leading-none font-bold">
        {site.name.bn}
      </span>
      <span className="rounded-md border px-1.5 font-mono text-xs text-muted-foreground">
        {site.name.en}
      </span>
    </Link>
  )
}
