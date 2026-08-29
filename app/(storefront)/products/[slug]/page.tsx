import Image from "next/image"
import { notFound } from "next/navigation"

import { PdpAddToCart } from "@/components/storefront/pdp-add-to-cart"
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card"
import { RichText } from "@/components/storefront/rich-text"
import { formatRupees } from "@/lib/format"
import { sanityFetch } from "@/sanity/lib/live"
import { PRODUCT_BY_SLUG_QUERY, RELATED_PRODUCTS_QUERY } from "@/lib/sanity/queries"
import type { ProductDetail } from "@/lib/sanity/types"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const productResult = await sanityFetch({ query: PRODUCT_BY_SLUG_QUERY, params: { slug } })
  const product = productResult.data as unknown as ProductDetail | null

  if (!product) notFound()

  const relatedResult = product.category
    ? await sanityFetch({
        query: RELATED_PRODUCTS_QUERY,
        params: { categorySlug: product.category.slug, slug },
      })
    : null
  const related = (relatedResult?.data as unknown as ProductCardData[] | undefined) ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {product.images?.[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                fill
                priority
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          {product.images && product.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.slice(1).map((img: { url: string; alt?: string }, i: number) => (
                <div
                  key={i}
                  className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted"
                >
                  <Image src={img.url} alt={img.alt ?? product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h1 className="font-heading text-2xl">{product.name}</h1>
          <p className="mt-2 text-lg font-medium text-primary">{formatRupees(product.price)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.stock > 0 ? "In stock" : "Out of stock"}
          </p>

          <div className="mt-4">
            <PdpAddToCart
              productId={product.id}
              name={product.name}
              price={product.price}
              image={product.images?.[0]?.url}
              slug={product.slug}
              stock={product.stock}
            />
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <RichText value={product.description} />
          </div>

          {product.isBundle && product.bundleItems?.length > 0 ? (
            <div className="mt-6 border-t border-border pt-6">
              <p className="mb-3 text-sm font-medium">This bundle includes:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {product.bundleItems.map((item: ProductCardData) => (
                  <li key={item.id}>
                    {item.name} — {formatRupees(item.price)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {related && related.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-6 font-heading text-xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((item: ProductCardData) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
