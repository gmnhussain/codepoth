import Link from "next/link"

import { Logo } from "@workspace/config/logo"
import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Logo, site name and English tag, linking home. Used in header and footer.
 * Named by its visible text plus a visually hidden "— হোম", never by an
 * `aria-label`: the name must contain every visible word (WCAG 2.5.3), so
 * a voice-control user can say "CodePoth" too.
 */
export function BrandLink({
  hideTagOnPhones = false,
}: {
  /**
   * Drops the English tag below `sm`, where the header's brand and buttons
   * do not fit beside it (down to 320px, the WCAG reflow width).
   */
  readonly hideTagOnPhones?: boolean
}) {
  return (
    <Link
      href="/"
      className="flex min-h-11 shrink-0 items-center gap-2.5 self-start rounded-lg"
    >
      <Logo className="size-7" />
      <span className="font-heading text-2xl leading-none font-bold">
        {site.name.bn}
      </span>
      {/* Keeps the words apart in the name; flex ignores it on screen. */}{" "}
      <span
        className={cn(
          "rounded-md border px-1.5 font-mono text-xs text-muted-foreground",
          hideTagOnPhones && "hidden sm:inline"
        )}
      >
        {site.name.en}
      </span>
      <span className="sr-only"> {t("site.homeSuffix")}</span>
    </Link>
  )
}
