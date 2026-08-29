import Link from "next/link"

import { ProductCard } from "@/components/storefront/product-card"
import { cn } from "@/lib/utils"
import { sanityFetch } from "@/sanity/lib/live"
import {
  CATEGORIES_QUERY,
  PRODUCTS_QUERY_NEWEST,
  PRODUCTS_QUERY_PRICE_ASC,
  PRODUCTS_QUERY_PRICE_DESC,
} from "@/lib/sanity/queries"
import type { Category, PaginatedProducts } from "@/lib/sanity/types"

type SortOption = "newest" | "price-asc" | "price-desc"

const PAGE_SIZE = 12

const QUERY_BY_SORT = {
  newest: PRODUCTS_QUERY_NEWEST,
  "price-asc": PRODUCTS_QUERY_PRICE_ASC,
  "price-desc": PRODUCTS_QUERY_PRICE_DESC,
} as const

export default async function ProductListingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>
}) {
  const { category, sort, page: pageParam } = await searchParams
  const sortOption: SortOption =
    sort === "price-asc" || sort === "price-desc" ? sort : "newest"
  const page = Math.max(1, Number(pageParam) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const [categoriesResult, productsResult] = await Promise.all([
    sanityFetch({ query: CATEGORIES_QUERY }),
    sanityFetch({
      query: QUERY_BY_SORT[sortOption],
      params: { categorySlug: category ?? null, offset, limit: PAGE_SIZE },
    }),
  ])

  const categories = categoriesResult.data as unknown as Category[]
  const { items: products, total } = productsResult.data as unknown as PaginatedProducts
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hrefFor = (params: { category?: string; sort?: SortOption; page?: number }) => ({
    query: {
      ...(params.category ? { category: params.category } : {}),
      ...(params.sort && params.sort !== "newest" ? { sort: params.sort } : {}),
      ...(params.page && params.page > 1 ? { page: String(params.page) } : {}),
    },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl">Shop the collection</h1>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <aside className="shrink-0 sm:w-48">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Category
          </p>
          <nav className="flex flex-wrap gap-2 sm:flex-col">
            <Link
              href="/products"
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors sm:rounded-none sm:px-0 sm:py-1",
                !category ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </Link>
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                href={hrefFor({ category: cat.slug, sort: sortOption })}
                className={cn(
                  "rounded-full px-3 py-1 text-sm transition-colors sm:rounded-none sm:px-0 sm:py-1",
                  category === cat.slug
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-end gap-2 text-sm">
            <span className="text-muted-foreground">Sort:</span>
            {(
              [
                { value: "newest", label: "Newest" },
                { value: "price-asc", label: "Price: Low to High" },
                { value: "price-desc", label: "Price: High to Low" },
              ] as const
            ).map((opt) => (
              <Link
                key={opt.value}
                href={hrefFor({ category, sort: opt.value })}
                className={cn(
                  sortOption === opt.value
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {products.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              No items match this filter yet — check back soon.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav
                  className="mt-8 flex items-center justify-center gap-4 text-sm"
                  aria-label="Product pages"
                >
                  {page > 1 ? (
                    <Link
                      href={hrefFor({ category, sort: sortOption, page: page - 1 })}
                      className="text-primary underline underline-offset-4"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Previous</span>
                  )}
                  <span className="text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={hrefFor({ category, sort: sortOption, page: page + 1 })}
                      className="text-primary underline underline-offset-4"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Next</span>
                  )}
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
