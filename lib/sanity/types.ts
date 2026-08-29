import type { PortableTextBlock } from "@portabletext/react"

import type { ProductCardData } from "@/components/storefront/product-card"

export interface SanityImage {
  url: string
  alt?: string
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface Banner {
  id: string
  image: SanityImage
  headline: string
  subtext?: string
  ctaLabel?: string
  ctaLink?: string
}

export interface ProductDetail extends ProductCardData {
  description: PortableTextBlock[]
  category: { name: string; slug: string } | null
  bundleItems: ProductCardData[]
}

export interface PaginatedProducts {
  items: ProductCardData[]
  total: number
}
