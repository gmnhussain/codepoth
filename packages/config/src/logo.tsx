/**
 * The site logo: two crossing lines with an interchange dot (docs/spec.md#config).
 * The name and logo are still an open question; change them here only.
 * Decorative: the link around it carries the accessible name.
 */
export function Logo({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 30 30" aria-hidden="true" className={className}>
      <path
        data-track-color="indigo"
        d="M3 23 L12 14 L27 14"
        className="fill-none stroke-track-dot"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        data-track-color="red"
        d="M12 3 L12 27"
        className="fill-none stroke-track-dot"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="14"
        r="4.5"
        className="fill-background stroke-foreground"
        strokeWidth="2.5"
      />
    </svg>
  )
}
