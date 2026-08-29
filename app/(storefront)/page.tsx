import Image from "next/image"
import Link from "next/link"

import { ProductCard, type ProductCardData } from "@/components/storefront/product-card"
import { Button } from "@/components/ui/button"
import { sanityFetch } from "@/sanity/lib/live"
import { ACTIVE_BANNERS_QUERY, PRODUCTS_QUERY } from "@/lib/sanity/queries"
import type { Banner } from "@/lib/sanity/types"

export default async function LandingPage() {
  const [heroResult, collectionResult, productsResult] = await Promise.all([
    sanityFetch({ query: ACTIVE_BANNERS_QUERY, params: { placement: "hero" } }),
    sanityFetch({ query: ACTIVE_BANNERS_QUERY, params: { placement: "collection" } }),
    sanityFetch({ query: PRODUCTS_QUERY, params: { categorySlug: null } }),
  ])

  const heroBanners = heroResult.data as unknown as Banner[]
  const collectionBanners = collectionResult.data as unknown as Banner[]
  const products = productsResult.data as unknown as ProductCardData[]

  const hero = heroBanners?.[0]
  const bestsellers = products?.slice(0, 8) ?? []

  return (
    <div>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-muted">
        {hero?.image?.url ? (
          <Image
            src={hero.image.url}
            alt={hero.image.alt ?? hero.headline}
            fill
            priority
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="relative mx-auto max-w-2xl px-4 text-center text-white">
          <h1 className="font-heading text-4xl font-medium sm:text-5xl">
            {hero?.headline ?? "Everyday elegance, made accessible"}
          </h1>
          {hero?.subtext ? (
            <p className="mt-4 text-base text-white/90">{hero.subtext}</p>
          ) : null}
          <Button asChild size="lg" className="mt-6">
            <Link href={hero?.ctaLink ?? "/products"}>{hero?.ctaLabel ?? "Shop Now"}</Link>
          </Button>
        </div>
      </section>

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
