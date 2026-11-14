import Link from "next/link"

import { formatYear } from "@workspace/config/format"
import type { LabelKey } from "@workspace/config/labels"
import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"
import { getAboutPage } from "@workspace/content/content"

import { BrandLink } from "@/components/brand-link"
import { NAV_ROUTES } from "@/lib/routes"

const LINK =
  "inline-flex min-h-11 items-center text-foreground/80 hover:text-foreground hover:underline hover:underline-offset-4"

type FooterColumn = {
  readonly id: string
  readonly heading: LabelKey
  readonly links: readonly { readonly href: string; readonly label: string }[]
}

/**
 * Footer columns. Course: every header page except Home. Site: Home's author
 * block and "নতুন কী", About and its privacy section when this build shows
 * the page (a draft is left out), and GitHub when it is set
 * (docs/spec.md#pages-v1: no link to a missing page).
 */
function footerColumns(): readonly FooterColumn[] {
  const hasAbout = getAboutPage() !== undefined
  return [
    {
      id: "footer-course",
      heading: "footer.course",
      links: NAV_ROUTES.filter((route) => route.href !== "/").map((route) => ({
        href: route.href,
        label: t(route.labelKey),
      })),
    },
    {
      id: "footer-site",
      heading: "footer.site",
      links: [
        { href: "/#author", label: t("footer.author") },
        { href: "/#new", label: t("footer.whatsNew") },
        ...(hasAbout
          ? [
              { href: "/about", label: t("footer.about") },
              { href: "/about#privacy", label: t("footer.privacy") },
            ]
          : []),
        ...(site.author.links.github === undefined
          ? []
          : [{ href: site.author.links.github, label: "GitHub" }]),
      ],
    },
  ]
}

/** Site footer with the course and site columns. The year is the build year. */
export function SiteFooter() {
  const columns = footerColumns()
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
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            {columns.map((column) => (
              <nav
                key={column.id}
                aria-labelledby={column.id}
                className="flex flex-col gap-1"
              >
                <h2
                  id={column.id}
                  className="font-sans text-sm font-semibold text-muted-foreground"
                >
                  {t(column.heading)}
                </h2>
                <ul className="flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      {/* Page links use next/link; a link to a #section
                          is a plain <a>, so the browser scrolls and sets
                          :target (pushState does not update :target). */}
                      {link.href.startsWith("/") && !link.href.includes("#") ? (
                        <Link href={link.href} className={LINK}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className={LINK}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
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
