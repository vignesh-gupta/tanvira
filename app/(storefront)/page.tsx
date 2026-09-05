import Image from "next/image"
import Link from "next/link"

import { FaqAccordion } from "@/components/storefront/faq-accordion"
import { HeroCarousel } from "@/components/storefront/hero-carousel"
import { ProductCard } from "@/components/storefront/product-card"
import { ViewAllPill } from "@/components/storefront/view-all-pill"
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
        <section className="px-4 py-8 sm:px-6 sm:py-12">
          <h2 className="mb-4 text-center font-heading text-xl sm:text-2xl">Shop by Trend</h2>
          <div className="mx-auto flex max-w-6xl snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
            {collectionBanners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.ctaLink ?? "/products"}
                className="group relative aspect-square w-28 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-auto"
              >
                {banner.image?.url ? (
                  <Image
                    src={banner.image.url}
                    alt={banner.image.alt ?? banner.headline}
                    fill
                    sizes="(min-width: 640px) 25vw, 112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2">
                  <span className="font-heading text-xs text-white sm:text-base">
                    {banner.headline}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="font-heading text-xl sm:text-2xl">Bestsellers</h2>
          <ViewAllPill href="/products" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <FaqAccordion />
    </div>
  )
}
