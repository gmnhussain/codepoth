import type { LabelKey } from "@workspace/config/labels"

/** A top-level page linked from the header and the mobile menu. */
export type NavRoute = {
  readonly href: string
  readonly labelKey: LabelKey
}

/**
 * Header navigation in display order. A page is added here in the same
 * commit that builds it, so the menu never links to a missing page
 * (conventions §2).
 */
export const NAV_ROUTES = [
  { href: "/", labelKey: "nav.home" },
  { href: "/roadmap", labelKey: "nav.roadmap" },
  { href: "/contents", labelKey: "nav.contents" },
  { href: "/glossary", labelKey: "nav.glossary" },
] as const satisfies readonly NavRoute[]

/** Whether `pathname` is `href` or a page below it ("/" matches only itself). */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
