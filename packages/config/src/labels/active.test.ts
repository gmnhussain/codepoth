import { describe, expect, it } from "vitest"

import { LABEL_SETS } from "../label-sets"
import { site } from "../site"
import { ACTIVE_LABEL_SET_ID, activeLabels } from "./active"

describe("active label set", () => {
  it("is the set site.labelSet selects", () => {
    expect(ACTIVE_LABEL_SET_ID).toBe(site.labelSet)
    expect(activeLabels).toEqual(LABEL_SETS[site.labelSet])
  })
})
