"use client"

import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart/cart-context"
import { formatRupees } from "@/lib/format"

export interface ProductCardData {
  id: string
  name: string
  slug: string
  price: number // paise
  images: { url: string; alt?: string }[]
  isBundle?: boolean
  stock: number
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart()
  const image = product.images?.[0]
  const outOfStock = product.stock <= 0

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: image?.url,
      slug: product.slug,
    })
    toast.success(`${product.name} added to cart`)
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}

        {product.isBundle && (
          <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground">
            BUNDLE
          </Badge>
        )}

        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={outOfStock}
          aria-label={`Add ${product.name} to cart`}
          className="absolute right-3 bottom-3 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-md transition-all duration-150 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock ? "Sold out" : "ADD"}
        </button>
      </div>

      <div className="p-3">
        <p className="truncate text-sm text-foreground">{product.name}</p>
        <p className="mt-1 text-sm font-medium text-primary">{formatRupees(product.price)}</p>
      </div>
    </Link>
  )
}
