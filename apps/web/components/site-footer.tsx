import Link from "next/link"

import { formatYear } from "@workspace/config/format"
import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"

import { BrandLink } from "@/components/brand-link"
import { NAV_ROUTES } from "@/lib/routes"

/** The course column: every header page except Home. */
const COURSE_ROUTES = NAV_ROUTES.filter((route) => route.href !== "/")

/**
 * Site footer. The course column follows NAV_ROUTES; the site column
 * (author, what's new, privacy) is added with the pages it points to, so no
 * link leads to a missing page (docs/spec.md#pages-v1). The year is the
 * build year.
 */
export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-9 px-4 pt-12 pb-7 sm:px-8">
        <div className="flex flex-wrap justify-between gap-9">
          <div className="flex max-w-sm flex-col gap-3">
            <BrandLink />
            <p className="leading-reading text-foreground/80">
              {t("site.tagline")}
            </p>
          </div>
          <nav aria-labelledby="footer-course" className="flex flex-col gap-1">
            <h2
              id="footer-course"
              className="font-sans text-sm font-semibold text-muted-foreground"
            >
              {t("footer.course")}
            </h2>
            <ul className="flex flex-col">
              {COURSE_ROUTES.map((route) => (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    className="inline-flex min-h-11 items-center text-foreground/80 hover:text-foreground hover:underline hover:underline-offset-4"
                  >
                    {t(route.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
