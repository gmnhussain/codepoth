import type { SearchMeta } from "@/lib/search/search-meta"

/**
 * A page's search details as Pagefind metadata (ADR-0015). Each value is the
 * text of a hidden element outside the indexed content, so it is read at
 * build time but never indexed as words, shown or announced.
 */
export function SearchMetaTags({ meta }: { readonly meta: SearchMeta }) {
  return (
    <div hidden>
      {Object.entries(meta).map(([key, value]) => (
        <span key={key} data-pagefind-meta={key}>
          {value}
        </span>
      ))}
    </div>
  )
}
