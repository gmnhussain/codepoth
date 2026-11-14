"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@workspace/ui/components/button"

import { useIsMounted } from "@/hooks/use-is-mounted"
import { useT } from "@/lib/labels-context"

/**
 * Switches between light and dark. The icon follows the `dark` class, so it
 * is right before hydration; the label waits for the resolved theme.
 */
export function ThemeToggle() {
  const t = useT(["theme"])
  const { resolvedTheme, setTheme } = useTheme()
  const isMounted = useIsMounted()
  const isDark = isMounted && resolvedTheme === "dark"
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
      onClick={() => {
        setTheme(isDark ? "light" : "dark")
      }}
    >
      <MoonIcon aria-hidden="true" className="dark:hidden" />
      <SunIcon aria-hidden="true" className="hidden dark:block" />
    </Button>
  )
}
