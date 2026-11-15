import { t } from "@workspace/config/t"

import { BrandLink } from "@/components/brand-link"
import { MobileNav } from "@/components/mobile-nav"
import { NavLinks } from "@/components/nav-links"
import { SearchButton } from "@/components/search/search-button"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * Site header: brand, page links (from `lg`), search, theme toggle (from
 * `sm`; below it, in the menu sheet) and mobile menu.
 */
export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3 sm:px-8">
        <BrandLink hideTagOnPhones />
        <nav aria-label={t("nav.main")} className="hidden flex-1 lg:block">
          <NavLinks
            className="flex flex-wrap gap-0.5"
            linkClassName="min-h-11 px-3.5"
          />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SearchButton />
          {/* Below sm it is in the menu sheet instead (no room here). */}
          <ThemeToggle className="hidden sm:inline-flex" />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
