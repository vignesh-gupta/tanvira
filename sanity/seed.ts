/**
 * Sanity seed data — see DB_SCHEMA.md § Seed Data Requirements.
 * Requires SANITY_API_TOKEN (a write-scoped token) in .env — this repo
 * doesn't have one configured, so this hasn't been run yet. Uses fixed
 * `_id`s with createOrReplace, so it's safe to re-run once a token exists.
 *
 * No product photography is available for seed content, so every seed
 * product/banner reuses the one real image asset already attached to the
 * "Gold Ring" product rather than leaving the (required) image field empty.
 */
import { writeClient } from "./lib/write-client"

async function getPlaceholderImageAssetRef(): Promise<string> {
  const existing = await writeClient.fetch<{ ref: string } | null>(
    `*[_type == "product" && defined(images[0].asset._ref)][0]{ "ref": images[0].asset._ref }`,
  )
  if (!existing?.ref) {
    throw new Error(
      "No existing product image found to reuse as a seed placeholder. Upload at least one product image in Sanity Studio first.",
    )
  }
  return existing.ref
}

async function seed() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error(
      "SANITY_API_TOKEN is not set — add a write-scoped token to .env before running this script.",
    )
    process.exit(1)
  }

  const imageRef = await getPlaceholderImageAssetRef()
  const image = (alt: string) => ({
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: imageRef },
    alt,
  })

  console.log("Seeding categories...")
  const categories = [
    { _id: "seed-category-rings", name: "Rings", slug: "rings", displayOrder: 0 },
    { _id: "seed-category-necklaces", name: "Necklaces", slug: "necklaces", displayOrder: 1 },
    { _id: "seed-category-earrings", name: "Earrings", slug: "earrings", displayOrder: 2 },
    { _id: "seed-category-bracelets", name: "Bracelets", slug: "bracelets", displayOrder: 3 },
  ]
  for (const c of categories) {
    await writeClient.createIfNotExists({
      _id: c._id,
      _type: "category",
      name: c.name,
      slug: { _type: "slug", current: c.slug },
      displayOrder: c.displayOrder,
    })
  }

  const description = (material: string, care: string) => [
    {
      _type: "block" as const,
      _key: "desc-1",
      style: "normal",
      children: [{ _type: "span" as const, _key: "desc-1-span", text: material }],
    },
    {
      _type: "block" as const,
      _key: "desc-2",
      style: "normal",
      listItem: "bullet" as const,
      children: [{ _type: "span" as const, _key: "desc-2-span", text: care }],
    },
  ]

  console.log("Seeding products...")
  const products = [
    { _id: "seed-product-solstice-ring", name: "Solstice Ring Stack", slug: "solstice-ring-stack", price: 899, category: "seed-category-rings", stock: 25 },
    { _id: "seed-product-aura-necklace", name: "Aura Pendant Necklace", slug: "aura-pendant-necklace", price: 1299, category: "seed-category-necklaces", stock: 18 },
    { _id: "seed-product-luna-earrings", name: "Luna Pearl Drop Earrings", slug: "luna-pearl-drop-earrings", price: 999, category: "seed-category-earrings", stock: 30 },
    { _id: "seed-product-riviera-bracelet", name: "Riviera Chain Bracelet", slug: "riviera-chain-bracelet", price: 749, category: "seed-category-bracelets", stock: 20 },
    { _id: "seed-product-golden-hour-ring", name: "Golden Hour 3-Ring Stack", slug: "golden-hour-3-ring-stack", price: 1099, category: "seed-category-rings", stock: 15 },
    { _id: "seed-product-soleil-necklace", name: "Soleil Pendant Necklace", slug: "soleil-pendant-necklace", price: 1499, category: "seed-category-necklaces", stock: 12 },
    { _id: "seed-product-luna-cuff", name: "Luna Cuff", slug: "luna-cuff", price: 849, category: "seed-category-bracelets", stock: 22 },
    { _id: "seed-product-hoop-earrings", name: "Classic Gold Hoops", slug: "classic-gold-hoops", price: 649, category: "seed-category-earrings", stock: 40 },
    { _id: "seed-product-vintage-ring", name: "Vintage Bloom Ring", slug: "vintage-bloom-ring", price: 799, category: "seed-category-rings", stock: 0 }, // out of stock
  ] as const

  for (const p of products) {
    await writeClient.createOrReplace({
      _id: p._id,
      _type: "product",
      name: p.name,
      slug: { _type: "slug", current: p.slug },
      images: [image(p.name)],
      description: description(
        "Gold-plated brass with artificial stones — imitation/fashion jewellery, not fine jewellery.",
        "Avoid contact with perfume and water; store in a dry pouch.",
      ),
      price: p.price,
      category: { _type: "reference", _ref: p.category },
      isBundle: false,
      stock: p.stock,
      isActive: true,
    })
  }

  console.log("Seeding bundles...")
  const bundles = [
    {
      _id: "seed-product-gifting-edit-bundle",
      name: "Gifting Edit Bundle",
      slug: "gifting-edit-bundle",
      price: 1999,
      category: "seed-category-necklaces",
      items: ["seed-product-aura-necklace", "seed-product-luna-earrings"],
    },
    {
      _id: "seed-product-everyday-stack-bundle",
      name: "Everyday Stack Bundle",
      slug: "everyday-stack-bundle",
      price: 1599,
      category: "seed-category-rings",
      items: ["seed-product-solstice-ring", "seed-product-riviera-bracelet"],
    },
  ] as const

  for (const b of bundles) {
    await writeClient.createOrReplace({
      _id: b._id,
      _type: "product",
      name: b.name,
      slug: { _type: "slug", current: b.slug },
      images: [image(b.name)],
      description: description(
        "A curated set of gold-plated brass pieces with artificial stones.",
        "Store each piece separately in a dry pouch.",
      ),
      price: b.price,
      category: { _type: "reference", _ref: b.category },
      isBundle: true,
      bundleItems: b.items.map((ref) => ({ _type: "reference", _ref: ref, _key: ref })),
      stock: 10,
      isActive: true,
    })
  }

  console.log("Seeding banners...")
  await writeClient.createOrReplace({
    _id: "seed-banner-hero",
    _type: "banner",
    image: image("Tanvira gifting edit hero banner"),
    headline: "The Gifting Edit",
    subtext: "Everyday elegance, made accessible.",
    ctaLabel: "Shop Now",
    ctaLink: "/products",
    placement: "hero",
    displayOrder: 0,
    isActive: true,
  })
  await writeClient.createOrReplace({
    _id: "seed-banner-collection",
    _type: "banner",
    image: image("Tanvira everyday wear collection"),
    headline: "Everyday Wear",
    ctaLabel: "Shop Now",
    ctaLink: "/products?category=rings",
    placement: "collection",
    displayOrder: 0,
    isActive: true,
  })

  console.log("Seeding promo codes...")
  await writeClient.createOrReplace({
    _id: "seed-promo-welcome10",
    _type: "promoCode",
    code: "WELCOME10",
    discountType: "flat",
    value: 100,
    usageLimit: 100,
    isActive: true,
  })
  await writeClient.createOrReplace({
    _id: "seed-promo-summer20-expired",
    _type: "promoCode",
    code: "SUMMER20",
    discountType: "percent",
    value: 20,
    validFrom: "2026-05-01T00:00:00.000Z",
    validTo: "2026-06-01T00:00:00.000Z", // in the past — for testing the "expired" error state
    isActive: true,
  })

  console.log("Done. Seeded 4 categories, 9 products, 2 bundles, 2 banners, 2 promo codes.")
}

seed().catch((err) => {
  console.error("Sanity seed failed:", err)
  process.exit(1)
})
