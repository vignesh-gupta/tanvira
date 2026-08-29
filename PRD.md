# Product Requirements Document — Tanvira

**Version:** 1.0
**Date:** August 29, 2026
**Status:** Draft

---

## 1. Overview

### Problem Statement

Tanvira is a small independent jewellery and accessories brand currently without a dedicated online storefront. Selling through informal channels (Instagram DMs, WhatsApp) limits discoverability, makes checkout friction-heavy, and gives the owner no self-serve way to manage catalog, promotions, or order status. Customers want a fast, trustworthy way to browse and buy without creating a cumbersome account, and the owner — running the business solo — needs to manage everything without depending on a developer for routine updates.

### Product Vision

A lean, elegant direct-to-consumer storefront for Tanvira where customers can browse gift and everyday-wear jewellery, check out in one frictionless flow, and track their order — while the owner runs the entire catalog, promotions, and homepage content herself through a CMS.

### Goals

- Launch a fully functional store (browse → cart → checkout → order tracking) quickly, without over-engineering for scale the business doesn't have yet
- Make checkout frictionless: no separate sign-up step, account is created automatically from checkout details
- Give the owner complete self-serve control over products, bundles, banners, and discount codes via Sanity Studio
- Build on a stack that stays cheap and solo-manageable now, but doesn't need a rewrite if the business grows

---

## 2. User Personas

### Primary Persona — Gift & Everyday-Wear Shopper

| Attribute      | Detail                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------- |
| Role           | Consumer, buying for herself or as a gift                                                |
| Age range      | 18–40                                                                                    |
| Tech-savviness | Medium–high; mobile-first, comfortable paying via UPI                                    |
| Key pain point | Doesn't want to create an account just to buy one item; wants to know where her order is |
| Motivation     | Affordable, well-curated jewellery for daily wear or gifting occasions                   |

### Secondary Persona — Store Owner (Tanvira)

| Attribute      | Detail                                                           |
| -------------- | ---------------------------------------------------------------- |
| Role           | Solo business owner, manages catalog + orders + promotions       |
| Age range      | Adult small-business operator                                    |
| Tech-savviness | Non-technical; needs a visual, no-code CMS                       |
| Key pain point | No developer on hand for day-to-day catalog changes              |
| Motivation     | Wants to add products, run sales, and track orders independently |

---

## 3. Success Metrics / KPIs

| Metric                                        | Target          | Timeframe            |
| --------------------------------------------- | --------------- | -------------------- |
| Visitor → order conversion rate               | 2–3%            | 3 months post-launch |
| Cart abandonment rate                         | Under 70%       | 3 months post-launch |
| Repeat purchase rate                          | 15%             | 6 months post-launch |
| Time for owner to add/update a product in CMS | Under 5 minutes | Ongoing              |

---

## 4. Scope

### In Scope (v1)

- Landing page: hero, featured collections, banners (owner-editable)
- Product listing page: category/price filtering, product cards
- Product detail page: images, rich-text description (material, size/length, care details all authored as part of the description — no separate variant selector UI), bundle products
- Cart: add/update/remove, persists across session
- Checkout: single flow collecting name + email → auto-creates account via email OTP (no separate sign-up) → shipping address (phone collected here as a plain delivery-contact field, not used for auth) → payment
- Payments: Razorpay (UPI, cards, netbanking)
- Order confirmation page + order status pages (Placed, Confirmed, Shipped, Delivered, Cancelled, Refunded)
- Passwordless login (email OTP) for returning customers to view order history
- Discount / promo codes applied at cart or checkout
- Bundles modeled as a product type (not a separate system)
- CMS (Sanity Studio): products, categories, bundles, homepage banners/content, discount codes, read-only order view

### Out of Scope (v1)

- Marketplace sync (Amazon/Flipkart) — not needed for a direct storefront
- Wishlist and product reviews/ratings — nice-to-have, deferred
- Multi-currency / international shipping — India-only for v1
- Loyalty/rewards program — deferred until repeat-purchase data exists
- Native mobile app — responsive web covers mobile-first usage
- GST-compliant tax invoicing — owner is not yet GST-registered; v1 issues simple order receipts, not tax invoices
- Courier/logistics API integration — order status updated manually by the owner via CMS for v1

---

## 5. Timeline & Milestones

No fixed launch date was specified — the plan below is phased so the store can go live in stages rather than as one large release. See `PLAN.md` for the detailed technical build plan.

| Milestone       | Description                                                                           |
| --------------- | ------------------------------------------------------------------------------------- |
| Foundation      | Next.js + Tailwind + shadcn scaffold, design tokens, Sanity schema, Better Auth setup |
| Core commerce   | Product listing/detail, cart, checkout flow, Razorpay integration                     |
| Orders & CMS    | Order status pages, promo codes, full CMS content types, order history                |
| Polish & launch | Responsive QA, accessibility pass, empty/error/loading states, soft launch            |

---

## 6. Assumptions & Dependencies

- Owner is not currently GST-registered; Razorpay onboarding will use PAN + bank account as a sole proprietor (permitted below the GST threshold), and checkout will issue simple receipts, not tax invoices, until GST registration happens
- Product photography is supplied by the owner
- Shipping/logistics are handled manually by the owner; order status is updated by hand in the CMS rather than pulled from a courier API in v1
- Single currency (INR), single region (India) for v1
- v1 runs entirely on free tiers (Vercel, Neon, Sanity, Resend) plus Razorpay's pay-per-transaction fee — there is no fixed monthly cost until the store has actual sales
- Phone number is collected at checkout as a plain delivery-contact field, not used for authentication, so no SMS OTP provider is needed for v1
- SMS OTP (e.g. via MSG91) is deferred to a later phase once revenue justifies the recurring per-message cost; Better Auth's architecture supports adding it later without restructuring auth

---

## 7. Open Questions

- When to add phone/SMS OTP as a second login method (post-revenue) and which provider (MSG91 recommended for INR pricing; Twilio as an international fallback)
- Return/refund policy specifics, which determine the exact rules for the "Cancelled" and "Refunded" order states
- Whether/when courier tracking (e.g. Shiprocket, Delhivery API) gets added post-v1
- When GST registration happens, checkout and CMS need an "invoice mode" update

---

## 8. Tech Stack

| Layer                | Choice                                          | Notes                                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework            | Next.js (App Router) + TypeScript               | SSR/ISR for product pages, API routes for backend logic                                                                                                                                                                                               |
| Styling / UI         | Tailwind CSS + shadcn/ui                        | Design tokens map to the burgundy/beige/gold palette (see `DESIGN.md`)                                                                                                                                                                                |
| CMS                  | Sanity                                          | Content-only: products, categories, bundles, banners, promo definitions. Fetched via `next-sanity` + GROQ, images via Sanity's image URL builder                                                                                                      |
| Auth                 | Better Auth                                     | Passwordless, email OTP plugin. Account is silently created the moment a customer enters name + email at checkout — no separate sign-up screen. Phone number is captured separately as a plain delivery-contact field, not used for auth in v1        |
| Transactional email  | Resend + React Email                            | Order confirmation, shipping updates, and email OTP for login — free tier (3,000 emails/month) covers v1 entirely                                                                                                                                     |
| Payments             | Razorpay                                        | Orders API + Checkout.js; UPI, cards, netbanking; webhook-driven payment confirmation. No fixed fee — only a per-transaction charge, so effectively free until there are sales. Onboarding possible with just PAN (no GSTIN required below threshold) |
| Database             | Neon (Postgres) + Drizzle ORM                   | Free tier. Holds transactional data: users (Better Auth tables), orders, payments, promo redemptions. Sanity is intentionally kept content-only, since it isn't built for high-write transactional data                                               |
| Validation           | Zod                                             | Shared schema validation across forms and API routes                                                                                                                                                                                                  |
| Client data/state    | TanStack Query                                  | Cart sync, order status polling                                                                                                                                                                                                                       |
| Forms                | React Hook Form                                 | Checkout and CMS-adjacent forms                                                                                                                                                                                                                       |
| Hosting              | Vercel (app) + Neon (DB) + Sanity (managed CMS) | All free tiers, sufficient for a small business at launch                                                                                                                                                                                             |
| _(Deferred)_ SMS OTP | MSG91 or Twilio                                 | The only paid line item in the stack. Not needed for v1 since auth is email-only; add later as a second login method once revenue justifies the per-message cost                                                                                      |

**Architecture note:** Sanity owns _content_ (what's editable by the owner without touching data integrity — products, banners, promo rules). Postgres owns _transactions_ (what must be consistent and queryable — users, orders, payments). This split keeps the CMS simple for a non-technical owner while keeping order data reliable.

**Cost note:** With this configuration, v1 runs at $0 fixed cost — the only spend is Razorpay's per-transaction fee, which only applies once a sale actually happens.
