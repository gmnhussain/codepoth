import { createContentCollectionPlugin } from "@content-collections/next"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
}

// Content lives in packages/content (ADR-0005). The `content:generate` task builds it
// before `next build`; this plugin rebuilds and watches it during `next dev`.
const withContentCollections = createContentCollectionPlugin({
  configPath: "../../packages/content/content-collections.ts",
})

export default withContentCollections(nextConfig)
