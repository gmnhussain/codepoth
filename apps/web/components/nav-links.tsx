"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { t } from "@workspace/config/t"
import { cn } from "@workspace/ui/lib/utils"

import { isActiveRoute, NAV_ROUTES } from "@/lib/routes"

/** The page links; the current page is marked for sight and screen readers. */
export function NavLinks({
  className,
  linkClassName,
  onNavigate,
}: {
  readonly className?: string
  readonly linkClassName?: string
  readonly onNavigate?: () => void
}) {
  const pathname = usePathname()
  return (
    <ul className={className}>
      {NAV_ROUTES.map((route) => {
        const isActive = isActiveRoute(pathname, route.href)
        return (
          <li key={route.href}>
            <Link
              href={route.href}
              {...(isActive ? { "aria-current": "page" as const } : {})}
              {...(onNavigate === undefined ? {} : { onClick: onNavigate })}
              className={cn(
                "flex items-center rounded-full font-medium text-foreground/80 hover:bg-muted hover:text-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground",
                linkClassName
              )}
            >
              {t(route.labelKey)}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
