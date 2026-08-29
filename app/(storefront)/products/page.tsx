import Link from "next/link"

import { ProductCard, type ProductCardData } from "@/components/storefront/product-card"
import { cn } from "@/lib/utils"
import { sanityFetch } from "@/sanity/lib/live"
import { CATEGORIES_QUERY, PRODUCTS_QUERY } from "@/lib/sanity/queries"
import type { Category } from "@/lib/sanity/types"

type SortOption = "newest" | "price-asc" | "price-desc"

export default async function ProductListingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>
}) {
  const { category, sort } = await searchParams
  const sortOption: SortOption =
    sort === "price-asc" || sort === "price-desc" ? sort : "newest"

  const [categoriesResult, productsResult] = await Promise.all([
    sanityFetch({ query: CATEGORIES_QUERY }),
    sanityFetch({ query: PRODUCTS_QUERY, params: { categorySlug: category ?? null } }),
  ])

  const categories = categoriesResult.data as unknown as Category[]
  const products = [...((productsResult.data as unknown as ProductCardData[]) ?? [])]
  if (sortOption === "price-asc") products.sort((a, b) => a.price - b.price)
  if (sortOption === "price-desc") products.sort((a, b) => b.price - a.price)

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
                href={`/products?category=${cat.slug}`}
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
                href={{ query: { category, sort: opt.value } }}
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
