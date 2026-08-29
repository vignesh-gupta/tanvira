import { defineQuery } from "next-sanity"

/**
 * Price is authored in rupees in Sanity (see product.ts) and converted to
 * paise here so every consumer downstream (cart, orders, Razorpay) works in
 * a single integer unit.
 */
export const productCardFields = /* groq */ `{
  "id": _id,
  name,
  "slug": slug.current,
  "price": round(price * 100),
  "images": images[]{ "url": asset->url, alt },
  isBundle,
  stock,
  "badge": select(isBundle => "bundle", defined(*[_type == "promoCode" && isActive][0]) => null, null)
}`

/**
 * Paginated at the GROQ level via [$offset...$offset+$limit] — this fetches
 * only one page's worth of documents from Sanity, not the whole catalog,
 * so it stays cheap as the product count grows. `total` comes back in the
 * same round trip so the page can render "Page X of Y" / disable Next
 * without a second request.
 *
 * GROQ can't parameterize which field `order()` sorts by, so each sort
 * option is its own query string rather than one query with a dynamic
 * order clause.
 */
const productsFilter = /* groq */ `_type == "product" && isActive == true
    && (!defined($categorySlug) || category->slug.current == $categorySlug)`

const paginatedProducts = (orderClause: string) =>
  defineQuery(`
    {
      "items": *[${productsFilter}] | order(${orderClause}) [$offset...$offset + $limit] ${productCardFields},
      "total": count(*[${productsFilter}])
    }
  `)

export const PRODUCTS_QUERY_NEWEST = paginatedProducts("_createdAt desc")
export const PRODUCTS_QUERY_PRICE_ASC = paginatedProducts("price asc")
export const PRODUCTS_QUERY_PRICE_DESC = paginatedProducts("price desc")

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $slug && isActive == true][0]{
    "id": _id,
    name,
    "slug": slug.current,
    "price": round(price * 100),
    "images": images[]{ "url": asset->url, alt },
    description,
    isBundle,
    "bundleItems": bundleItems[]-> ${productCardFields},
    stock,
    "category": category->{ name, "slug": slug.current }
  }
`)

export const RELATED_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && isActive == true && category->slug.current == $categorySlug && slug.current != $slug]
    | order(_createdAt desc)[0...4] ${productCardFields}
`)

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(displayOrder asc){
    "id": _id,
    name,
    "slug": slug.current
  }
`)

export const ACTIVE_BANNERS_QUERY = defineQuery(`
  *[_type == "banner" && isActive == true && placement == $placement]
    | order(displayOrder asc){
    "id": _id,
    "image": image{ "url": asset->url, alt },
    headline,
    subtext,
    ctaLabel,
    ctaLink
  }
`)

export const PROMO_CODE_QUERY = defineQuery(`
  *[_type == "promoCode" && code == $code][0]{
    code,
    discountType,
    value,
    validFrom,
    validTo,
    usageLimit,
    isActive
  }
`)
