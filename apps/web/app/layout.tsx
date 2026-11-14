import { Anek_Bangla, Hind_Siliguri, JetBrains_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

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
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
