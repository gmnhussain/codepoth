"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useIsMounted } from "@/hooks/use-is-mounted"
import { useT } from "@/lib/labels-context"

/**
 * Switches between light and dark. The icon follows the `dark` class, so it
 * is right before hydration; the label, which names the action, waits for
 * the resolved theme. `icon` is the header's square button (its label is
 * its name); `labelled` shows the label beside the icon, for the mobile
 * menu.
 */
export function ThemeToggle({
  variant = "icon",
  className,
}: {
  readonly variant?: "icon" | "labelled"
  readonly className?: string
}) {
  const t = useT(["theme"])
  const { resolvedTheme, setTheme } = useTheme()
  const isMounted = useIsMounted()
  const isDark = isMounted && resolvedTheme === "dark"
  const label = isDark ? t("theme.toLight") : t("theme.toDark")
  const isLabelled = variant === "labelled"
  return (
    <Button
      variant="outline"
      size={isLabelled ? "default" : "icon"}
      aria-label={isLabelled ? undefined : label}
      onClick={() => {
        setTheme(isDark ? "light" : "dark")
      }}
      className={cn(isLabelled && "justify-start gap-3", className)}
    >
      <MoonIcon aria-hidden="true" className="dark:hidden" />
      <SunIcon aria-hidden="true" className="hidden dark:block" />
      {isLabelled ? label : null}
    </Button>
  )
}
