import { t } from "@workspace/config/t"

/**
 * Lets keyboard users jump past the header (WCAG 2.4.1). Visible on focus;
 * the padding sits on `focus:` because `not-sr-only` resets padding to 0.
 */
export function SkipLink({ targetId }: { readonly targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-full bg-primary text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-5 focus:py-3"
    >
      {t("nav.skipToContent")}
    </a>
  )
}
