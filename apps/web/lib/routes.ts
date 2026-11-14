import type { LabelKey } from "@workspace/config/labels"

/** A top-level page linked from the header and the mobile menu. */
export type NavRoute = {
  readonly href: string
  readonly labelKey: LabelKey
  /** False for a personal page: `noindex`, and left out of the sitemap. */
  readonly indexable: boolean
}

/**
 * Header navigation in display order. A page is added here in the same
 * commit that builds it, so the menu never links to a missing page
 * (conventions §2).
 */
export const NAV_ROUTES = [
  { href: "/", labelKey: "nav.home", indexable: true },
  { href: "/roadmap", labelKey: "nav.roadmap", indexable: true },
  { href: "/contents", labelKey: "nav.contents", indexable: true },
  { href: "/glossary", labelKey: "nav.glossary", indexable: true },
  // The reader's own progress: nothing for a search engine (step 14).
  { href: "/dashboard", labelKey: "nav.dashboard", indexable: false },
] as const satisfies readonly NavRoute[]

/** Whether a header page may be indexed (false: `noindex`, no sitemap entry). */
export function isIndexableRoute(href: string): boolean {
  return NAV_ROUTES.find((route) => route.href === href)?.indexable ?? true
}

/** Whether `pathname` is `href` or a page below it ("/" matches only itself). */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
