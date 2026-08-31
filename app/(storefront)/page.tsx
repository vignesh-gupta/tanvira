import Image from "next/image"
import Link from "next/link"

import { HeroCarousel } from "@/components/storefront/hero-carousel"
import { ProductCard } from "@/components/storefront/product-card"
import { sanityFetch } from "@/sanity/lib/live"
import { ACTIVE_BANNERS_QUERY, PRODUCTS_QUERY_NEWEST } from "@/lib/sanity/queries"
import type { Banner, PaginatedProducts } from "@/lib/sanity/types"

const BESTSELLER_COUNT = 8

export default async function LandingPage() {
  const [heroResult, collectionResult, productsResult] = await Promise.all([
    sanityFetch({ query: ACTIVE_BANNERS_QUERY, params: { placement: "hero" } }),
    sanityFetch({ query: ACTIVE_BANNERS_QUERY, params: { placement: "collection" } }),
    sanityFetch({
      query: PRODUCTS_QUERY_NEWEST,
      params: { categorySlug: null, offset: 0, limit: BESTSELLER_COUNT },
    }),
  ])

  const heroBanners = heroResult.data as unknown as Banner[]
  const collectionBanners = collectionResult.data as unknown as Banner[]
  const { items: bestsellers } = productsResult.data as unknown as PaginatedProducts

  return (
    <div>
      <HeroCarousel banners={heroBanners ?? []} />

      {collectionBanners && collectionBanners.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {collectionBanners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.ctaLink ?? "/products"}
                className="group relative aspect-[16/9] overflow-hidden rounded-lg"
              >
                {banner.image?.url ? (
                  <Image
                    src={banner.image.url}
                    alt={banner.image.alt ?? banner.headline}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="font-heading text-lg text-white">{banner.headline}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl">Bestsellers</h2>
          <Link href="/products" className="text-sm text-primary underline underline-offset-4">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
