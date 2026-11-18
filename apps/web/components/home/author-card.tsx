import { GlobeIcon } from "lucide-react"

import { site } from "@workspace/config/site"
import { t } from "@workspace/config/t"
import { buttonVariants } from "@workspace/ui/components/button"

/** Initials for the avatar: the first letter of each name word that is not an abbreviation. */
function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter((word) => word !== "" && !word.endsWith("."))
    .map((word) => word.charAt(0))
    .join("")
}

/** A link's visible text: the host name, e.g. "nazmulhussain.com". */
function hostOf(url: string): string {
  return new URL(url).host
}

/**
 * The author block (`#author`, the footer's link), from `site.author`. Links
 * render only when set (docs/spec.md#pages-v1).
 */
export function AuthorCard() {
  const { author } = site
  const links = [
    { href: author.links.website, label: undefined, icon: true },
    { href: author.links.github, label: "GitHub", icon: false },
    { href: author.links.linkedin, label: "LinkedIn", icon: false },
  ].flatMap(({ href, label, icon }) =>
    // The website shows its host name; the others their service's name.
    href === undefined ? [] : [{ href, label: label ?? hostOf(href), icon }]
  )

  return (
    <section
      id="author"
      aria-labelledby="author-heading"
      className="flex min-w-0 scroll-mt-24 flex-col gap-4 rounded-2xl border bg-card p-7 lg:flex-2"
    >
      <p className="text-sm font-semibold text-muted-foreground">
        {t("footer.author")}
      </p>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full border bg-muted font-heading text-xl font-semibold text-foreground/80"
        >
          {initialsOf(author.name.bn)}
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="author-heading" className="text-xl font-semibold">
            {t("home.writtenBy", { name: author.name.bn })}
          </h2>
          <p className="text-sm leading-relaxed text-foreground/80">
            {author.bio.bn}
          </p>
        </div>
      </div>
      {links.length > 0 ? (
        <ul className="mt-auto flex flex-wrap gap-2">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {link.icon ? <GlobeIcon aria-hidden="true" /> : null}
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
