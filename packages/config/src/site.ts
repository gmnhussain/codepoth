/** The author's profile links; an unset one is not rendered. */
type AuthorLinks = {
  readonly website: string | undefined
  readonly github: string | undefined
  readonly linkedin: string | undefined
}

const authorLinks: AuthorLinks = {
  website: "https://nazmulhussain.com",
  github: undefined,
  linkedin: undefined,
}

/**
 * Site identity and the active label set (docs/spec.md#config).
 * Name and logo are still an open question (docs/decisions/README.md).
 */
export const site = {
  name: { bn: "কোডপথ", en: "CodePoth" },
  url: "https://codepoth.nazmulhussain.com",
  /** Time zone authors date content in; the build date is taken in it. */
  timeZone: "Asia/Dhaka",
  author: {
    name: { bn: "জি. এম. নাজমুল হুসাইন", en: "G. M. Nazmul Hussain" },
    /** One line under the name in Home's author block (taken from the design). */
    bio: {
      bn: "সফটওয়্যার ইঞ্জিনিয়ার; বাংলায় সহজ করে প্রোগ্রামিং শেখানোর কাজ করছেন।",
    },
    links: authorLinks,
  },
  labelSet: "bn-metro",
} as const
