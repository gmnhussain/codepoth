/**
 * Site identity and the active label set (docs/spec.md#config).
 * Name and logo are still an open question (docs/decisions/README.md).
 * An author link without a value is not rendered.
 */
export const site = {
  name: { bn: "কোডপথ", en: "CodePoth" },
  url: "https://codepoth.nazmulhussain.com",
  author: {
    name: { bn: "জি. এম. নাজমুল হুসাইন", en: "G. M. Nazmul Hussain" },
    links: {
      website: "https://nazmulhussain.com",
      github: undefined,
      linkedin: undefined,
    },
  },
  labelSet: "bn-metro",
} as const
