import type { Metadata } from "next"
import { Anek_Bangla, Hind_Siliguri, JetBrains_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { site } from "@workspace/config/site"
import { isIndexableBuild } from "@workspace/content/env"
import { t } from "@workspace/config/t"
import { cn } from "@workspace/ui/lib/utils"

import { LabelScope } from "@/components/label-scope"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { SkipLink } from "@/components/skip-link"
import { ThemeProvider } from "@/components/theme-provider"

// Fonts and weights: docs/design.md#fonts. Anek Bangla is variable, so it loads
// as one file without a weight list (docs/development/performance.md#fonts).
// `optional`: a font not ready by the first paint is not swapped in later,
// so web fonts never re-wrap text under the reader; the next page uses it
// from the cache (performance.md#fonts).
const displayFont = Anek_Bangla({
  subsets: ["bengali", "latin"],
  display: "optional",
  variable: "--font-display",
})

// Hind Siliguri has no variable version, so each weight in use is listed.
const bodyFont = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600"],
  display: "optional",
  variable: "--font-body",
})

// No Bangla subset; Bangla characters in code fall back to the body font.
// No metric-adjusted Arial fallback: with `optional` the font never swaps
// in later, so the fallback is what code shows when the font is late, and
// it must be monospaced. globals.css gives `--font-mono` a monospace stack.
const codeFont = JetBrains_Mono({
  subsets: ["latin"],
  display: "optional",
  adjustFontFallback: false,
})

// Turbopack in Next 16.4.5 ignores `adjustFontFallback` for next/font/google
// (webpack honours it), so `style.fontFamily` still ends in the Arial
// fallback. `--font-code` is set on <html> to the font's own family alone.
// Re-check on every Next upgrade; once the option works, go back to
// `variable: "--font-code"` and `codeFont.variable` (docs/design.md#fonts).
const codeFontFamily =
  codeFont.style.fontFamily.split(",")[0] ?? codeFont.style.fontFamily
const htmlStyle = { "--font-code": codeFontFamily } as React.CSSProperties

const MAIN_CONTENT_ID = "main"

/** Label groups the shell's client components and error.tsx need. */
const SHELL_LABELS = ["common", "theme", "nav", "error", "search"] as const

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name.bn, template: `%s · ${site.name.bn}` },
  description: t("site.tagline"),
  applicationName: site.name.bn,
  openGraph: { siteName: site.name.bn, locale: "bn_BD", type: "website" },
  // Pages inherit this; only a production deploy without drafts is indexed
  // (conventions §12).
  ...(isIndexableBuild(process.env)
    ? {}
    : { robots: { index: false, follow: false } }),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        displayFont.variable,
        bodyFont.variable
      )}
      style={htmlStyle}
    >
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          {/* Labels the shell's islands and error.tsx use; pages add their
              own groups with a nested LabelScope (ADR-0013). */}
          <LabelScope namespaces={SHELL_LABELS}>
            <SkipLink targetId={MAIN_CONTENT_ID} />
            <SiteHeader />
            <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </LabelScope>
        </ThemeProvider>
      </body>
    </html>
  )
}
