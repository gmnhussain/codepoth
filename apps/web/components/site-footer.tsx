import { formatYear } from "@workspace/config/format"
import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"

import { BrandLink } from "@/components/brand-link"

/**
 * Site footer. The link columns (course pages, author, what's new, privacy)
 * are added with the pages they point to, so no link leads to a missing page
 * (docs/spec.md#pages-v1). The year is the build year.
 */
export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-9 px-4 pt-12 pb-7 sm:px-8">
        <div className="flex max-w-sm flex-col gap-3">
          <BrandLink />
          <p className="leading-reading text-foreground/80">
            {t("site.tagline")}
          </p>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t pt-5 text-sm text-muted-foreground">
          <span>
            {t("site.copyright", {
              year: formatYear(new Date()),
              name: site.name.bn,
            })}
          </span>
          <span>{t("site.noTracking")}</span>
        </div>
      </div>
    </footer>
  )
}
