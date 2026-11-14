import type { JsonLdData } from "@workspace/content/json-ld"
import { serializeJsonLd } from "@workspace/content/json-ld"

/**
 * Structured data as `<script type="application/ld+json">` (D-37). The only
 * place the app writes raw HTML: `serializeJsonLd` escapes `<`, `>` and `&`,
 * so content such as `</script>` cannot leave the script element (tested in
 * packages/content).
 */
export function JsonLd({ data }: { readonly data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
