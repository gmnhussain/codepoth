import type { Metadata } from "next"
import { Anek_Bangla, Hind_Siliguri, JetBrains_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"
import { cn } from "@workspace/ui/lib/utils"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { SkipLink } from "@/components/skip-link"
import { ThemeProvider } from "@/components/theme-provider"

// Fonts and weights: docs/design.md#fonts. Anek Bangla is variable, so it loads
// as one file without a weight list (docs/development/performance.md#fonts).
const displayFont = Anek_Bangla({
  subsets: ["bengali", "latin"],
  display: "swap",
  variable: "--font-display",
})

// Hind Siliguri has no variable version, so each weight in use is listed.
const bodyFont = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body",
})

// No Bangla subset; Bangla characters in code fall back to the body font.
// Not preloaded: code is rarely above the fold, and preloading would add
// ~40 KB to every page.
const codeFont = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-code",
})

const MAIN_CONTENT_ID = "main"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name.bn, template: `%s · ${site.name.bn}` },
  description: t("site.tagline"),
  applicationName: site.name.bn,
  openGraph: { siteName: site.name.bn, locale: "bn_BD", type: "website" },
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
        bodyFont.variable,
        codeFont.variable
      )}
    >
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          <SkipLink targetId={MAIN_CONTENT_ID} />
          <SiteHeader />
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}
