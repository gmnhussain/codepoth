"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// The template's bare "d" key shortcut is removed: a single-key shortcut
// with no way to turn it off fails WCAG 2.2 SC 2.1.4. The header's theme
// toggle (added with the site shell) switches the theme instead.
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
