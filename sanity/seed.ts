/**
 * Sanity seed data — see DB_SCHEMA.md § Seed Data Requirements.
 * Requires SANITY_API_TOKEN (a write-scoped token) in .env — this repo
 * doesn't have one configured, so this hasn't been run yet. Uses fixed
 * `_id`s with createOrReplace, so it's safe to re-run once a token exists.
 *
 * Names, prices, categories and imagery are pulled from the Figma design
 * (Tanvira, page "06 — Products & Catalog" and "05 — Brand & Marketing") so
 * seeded content matches what the mockups show. Each image lives as a real
 * file under sanity/seed-images/ — uploadSeedImageAsset() checks the
 * dataset for a `sanity.imageAsset` with that filename before uploading, so
 * re-running this script never creates duplicate assets.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { writeClient } from "./lib/write-client"

const SEED_IMAGES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "seed-images")

const assetIdByFilename = new Map<string, string>()

async function uploadSeedImageAsset(filename: string): Promise<string> {
  const cached = assetIdByFilename.get(filename)
  if (cached) return cached

  const existingId = await writeClient.fetch<string | null>(
    `*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`,
    { filename },
  )
  if (existingId) {
    assetIdByFilename.set(filename, existingId)
    return existingId
  }

  console.log(`  Uploading seed image: ${filename}`)
  const filePath = path.join(SEED_IMAGES_DIR, filename)
  const asset = await writeClient.assets.upload("image", fs.createReadStream(filePath), {
    filename,
  })
  assetIdByFilename.set(filename, asset._id)
  return asset._id
}

async function image(alt: string, filename: string) {
  return {
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: await uploadSeedImageAsset(filename) },
    alt,
  }
}

const CARE_BULLETS = [
  "Avoid contact with water and perfume",
  "Store in the pouch provided",
  "Polish gently with a soft cloth",
]

function description(sizeLine: string) {
  return [
    {
      _type: "block" as const,
      _key: "size-heading",
      style: "h4",
      children: [{ _type: "span" as const, _key: "size-heading-span", text: "Size & Length" }],
    },
    {
      _type: "block" as const,
      _key: "size-line",
      style: "normal",
      children: [{ _type: "span" as const, _key: "size-line-span", text: sizeLine }],
    },
    {
      _type: "block" as const,
      _key: "care-heading",
      style: "h4",
      children: [{ _type: "span" as const, _key: "care-heading-span", text: "Care Instructions" }],
    },
    ...CARE_BULLETS.map((text, i) => ({
      _type: "block" as const,
      _key: `care-${i}`,
      style: "normal",
      listItem: "bullet" as const,
      children: [{ _type: "span" as const, _key: `care-${i}-span`, text }],
    })),
  ]
}

const SIZE_LINE = {
  necklace:
    'Handcrafted in 18k gold vermeil over sterling silver. Chain length 16″–18″ with a 2″ extender for adjustable fit.',
  earrings:
    "Handcrafted in 18k gold vermeil over sterling silver. Lightweight ear wires, comfortable for all-day wear.",
  bracelet:
    'Handcrafted in 18k gold vermeil over sterling silver. Adjustable 6.5″–8″ with a 2″ extender for a customizable fit.',
  ringStack:
    "Handcrafted in 18k gold vermeil over sterling silver. Sold as a stackable set — mix, match, and wear together or apart.",
  earCuffSet:
    "Handcrafted in 18k gold vermeil over sterling silver. Adjustable cuff design, no piercing required.",
}

async function seed() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error(
      "SANITY_API_TOKEN is not set — add a write-scoped token to .env before running this script.",
    )
    process.exit(1)
  }

  console.log("Seeding categories...")
  const categories = [
    { _id: "seed-category-necklaces", name: "Necklaces", slug: "necklaces", displayOrder: 0 },
    { _id: "seed-category-earrings", name: "Earrings", slug: "earrings", displayOrder: 1 },
    { _id: "seed-category-bracelets", name: "Bracelets", slug: "bracelets", displayOrder: 2 },
    { _id: "seed-category-bundles", name: "Bundles", slug: "bundles", displayOrder: 3 },
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

  console.log("Seeding products...")
  const products = [
    {
      _id: "seed-product-soleil-pendant-necklace",
      name: "Soleil Pendant Necklace",
      slug: "soleil-pendant-necklace",
      price: 3299,
      category: "seed-category-necklaces",
      stock: 25,
      imageFile: "necklace-and-rings-flatlay.png",
      sizeLine: SIZE_LINE.necklace,
    },
    {
      _id: "seed-product-aura-pendant-necklace",
      name: "Aura Pendant Necklace",
      slug: "aura-pendant-necklace",
      price: 2899,
      category: "seed-category-necklaces",
      stock: 18,
      imageFile: "necklace-sunburst-pendant.png",
      sizeLine: SIZE_LINE.necklace,
    },
    {
      _id: "seed-product-dusk-layered-necklace",
      name: "Dusk Layered Necklace",
      slug: "dusk-layered-necklace",
      price: 4299,
      category: "seed-category-necklaces",
      stock: 0, // out of stock
      imageFile: "necklace-disc-pendant.png",
      sizeLine: SIZE_LINE.necklace,
    },
    {
      _id: "seed-product-aurelia-drop-pendant",
      name: "Aurelia Drop Pendant",
      slug: "aurelia-drop-pendant",
      price: 3899,
      category: "seed-category-necklaces",
      stock: 14,
      imageFile: "necklace-solitaire-pendant.png",
      sizeLine: SIZE_LINE.necklace,
    },
    {
      _id: "seed-product-luna-pearl-drop-earrings",
      name: "Luna Pearl Drop Earrings",
      slug: "luna-pearl-drop-earrings",
      price: 2199,
      category: "seed-category-earrings",
      stock: 30,
      imageFile: "earrings-pearl-drop.png",
      sizeLine: SIZE_LINE.earrings,
    },
    {
      _id: "seed-product-celestine-hoop-earrings",
      name: "Celestine Hoop Earrings",
      slug: "celestine-hoop-earrings",
      price: 1999,
      category: "seed-category-earrings",
      stock: 40,
      imageFile: "earrings-gold-hoops.png",
      sizeLine: SIZE_LINE.earrings,
    },
    {
      _id: "seed-product-luna-cuff",
      name: "Luna Cuff",
      slug: "luna-cuff",
      price: 3699,
      category: "seed-category-bracelets",
      stock: 20,
      imageFile: "bracelet-gold-bangle.png",
      sizeLine: SIZE_LINE.bracelet,
    },
    {
      _id: "seed-product-riviera-chain-bracelet",
      name: "Riviera Chain Bracelet",
      slug: "riviera-chain-bracelet",
      price: 2499,
      category: "seed-category-bracelets",
      stock: 22,
      imageFile: "bracelet-charm-discs.png",
      sizeLine: SIZE_LINE.bracelet,
    },
    {
      _id: "seed-product-etoile-charm-bracelet",
      name: "Étoile Charm Bracelet",
      slug: "etoile-charm-bracelet",
      price: 2799,
      category: "seed-category-bracelets",
      stock: 16,
      imageFile: "bracelets-and-rings-lifestyle.png",
      sizeLine: SIZE_LINE.bracelet,
    },
  ] as const

  for (const p of products) {
    await writeClient.createOrReplace({
      _id: p._id,
      _type: "product",
      name: p.name,
      slug: { _type: "slug", current: p.slug },
      images: [await image(p.name, p.imageFile)],
      description: description(p.sizeLine),
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
      _id: "seed-product-golden-hour-ring-stack",
      name: "Golden Hour — 3-Ring Stack",
      slug: "golden-hour-3-ring-stack",
      price: 4799,
      stock: 15,
      imageFile: "ring-stack-duo.png",
      sizeLine: SIZE_LINE.ringStack,
      items: ["seed-product-aurelia-drop-pendant", "seed-product-luna-pearl-drop-earrings"],
    },
    {
      _id: "seed-product-solstice-ring-stack",
      name: "Solstice Ring Stack",
      slug: "solstice-ring-stack",
      price: 5199,
      stock: 12,
      imageFile: "ring-stack-trio.png",
      sizeLine: SIZE_LINE.ringStack,
      items: ["seed-product-aura-pendant-necklace", "seed-product-etoile-charm-bracelet"],
    },
    {
      _id: "seed-product-mira-ear-cuff-set",
      name: "Mira Ear Cuff Set",
      slug: "mira-ear-cuff-set",
      price: 1599,
      stock: 24,
      imageFile: "hoops-and-chain-lifestyle.png",
      sizeLine: SIZE_LINE.earCuffSet,
      items: ["seed-product-riviera-chain-bracelet", "seed-product-soleil-pendant-necklace"],
    },
  ] as const

  for (const b of bundles) {
    await writeClient.createOrReplace({
      _id: b._id,
      _type: "product",
      name: b.name,
      slug: { _type: "slug", current: b.slug },
      images: [await image(b.name, b.imageFile)],
      description: description(b.sizeLine),
      price: b.price,
      category: { _type: "reference", _ref: "seed-category-bundles" },
      isBundle: true,
      bundleItems: b.items.map((ref) => ({ _type: "reference", _ref: ref, _key: ref })),
      stock: b.stock,
      isActive: true,
    })
  }

  console.log("Seeding banners...")
  await writeClient.createOrReplace({
    _id: "seed-banner-hero",
    _type: "banner",
    image: await image(
      "Layered gold bracelets and a stacked ring set on natural linen",
      "bracelets-and-rings-lifestyle.png",
    ),
    headline: "Gold that moves with you, from dawn to midnight.",
    subtext:
      "Each piece is hand-finished in 18k gold vermeil over sterling silver — built to last, light enough to forget you're wearing it, beautiful enough that others won't.",
    ctaLabel: "Explore the Edit",
    ctaLink: "/products",
    placement: "hero",
    displayOrder: 0,
    isActive: true,
  })
  await writeClient.createOrReplace({
    _id: "seed-banner-gifting-edit",
    _type: "banner",
    image: await image(
      "A boxed pendant necklace styled with dried florals and ribbon for gifting",
      "gifting-flatlay.png",
    ),
    headline: "The Gifting Edit",
    subtext: "Thoughtful pieces for milestones, celebrations, and the moments in between.",
    ctaLabel: "Shop Now",
    ctaLink: "/products?category=necklaces",
    placement: "collection",
    displayOrder: 0,
    isActive: true,
  })
  await writeClient.createOrReplace({
    _id: "seed-banner-everyday-edit",
    _type: "banner",
    image: await image(
      "Gold hoop earrings and a layered chain resting on travertine stone",
      "hoops-and-chain-lifestyle.png",
    ),
    headline: "The Everyday Edit",
    subtext: "Quiet staples designed for all-day, every-day wear without a second thought.",
    ctaLabel: "Shop Now",
    ctaLink: "/products?category=bracelets",
    placement: "collection",
    displayOrder: 1,
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

  console.log("Done. Seeded 4 categories, 9 products, 3 bundles, 3 banners, 2 promo codes.")
}

seed().catch((err) => {
  console.error("Sanity seed failed:", err)
  process.exit(1)
})
