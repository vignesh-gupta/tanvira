# Product Requirements Document — Tanvira

**Version:** 1.0
**Date:** August 29, 2026
**Status:** Draft

---

## Executive Summary

Tanvira needs a direct-to-consumer storefront so it can stop selling through Instagram DMs and WhatsApp. This PRD scopes a Next.js storefront — landing, browsable catalog with quick Add to Cart from the grid (mass-market imitation-jewellery pricing is low-consideration), cart, a single-flow checkout that silently creates an account via email OTP, Cashfree payments, and order tracking — plus a Sanity Studio CMS so the owner can run products, banners, and promo codes herself. v1 deliberately runs at $0 fixed cost (Vercel/Neon/Sanity/Resend free tiers + Cashfree's per-transaction fee) and defers anything that isn't needed to take the first sale (wishlists, reviews, loyalty, multi-currency, a native app). See [DESIGN.md](./DESIGN.md) for screens/flows and [ARCHITECTURE.md](./ARCHITECTURE.md) for the technical shape.

---

## 1. Overview

### Problem Statement

Tanvira is a small independent jewellery and accessories brand currently without a dedicated online storefront. Selling through informal channels (Instagram DMs, WhatsApp) limits discoverability, makes checkout friction-heavy, and gives the owner no self-serve way to manage catalog, promotions, or order status. Customers want a fast, trustworthy way to browse and buy without creating a cumbersome account, and the owner — running the business solo — needs to manage everything without depending on a developer for routine updates.

### Product Vision

A lean, elegant direct-to-consumer storefront for Tanvira — a mass-market imitation/fashion jewellery brand (gold-plated, artificial stones; not fine/precious jewellery) — where customers can browse gift and everyday-wear pieces, add to cart straight from the listing grid, check out in one frictionless flow, and track their order — while the owner runs the entire catalog, promotions, and homepage content herself through a CMS.

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
| Motivation     | Affordable, well-curated imitation/fashion jewellery for daily wear or gifting occasions — often buys more than one piece per visit |

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
- Product listing page: category/price filtering, product cards with quick **Add to Cart** directly from the grid — mass-market imitation-jewellery price points are low-consideration, so customers shouldn't have to open a product's detail page just to buy it; tapping the image/name still opens the PDP for full details
- Product detail page: images, rich-text description (material, size/length, care details all authored as part of the description — no separate variant selector UI), bundle products
- Cart: add/update/remove, persists across session
- Checkout: single flow collecting name + email → auto-creates account via email OTP (no separate sign-up) → shipping address (phone collected here as a plain delivery-contact field, not used for auth) → payment
- Payments: Cashfree (UPI, cards, netbanking)
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

## 5. Feature List

| Feature                          | Priority | Description                                                                                   | Acceptance Criteria                                                                                                    |
| --------------------------------- | -------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Landing page (CMS-driven)         | P0       | Hero, featured collections, bestsellers, brand story — all owner-editable                       | Owner can change hero image/headline/CTA and see it live without a deploy; page renders a static fallback if CMS fetch fails |
| Product listing + quick Add to Cart | P0     | Category/price filters, sort, product grid with an Add to Cart button on every card              | Adding from the grid updates cart count and shows inline confirmation without leaving the page; tapping image/name opens the PDP |
| Product detail page               | P0       | Gallery, rich-text description (material/size/care as one CMS block), bundle contents, Add to Cart | Out-of-stock disables the CTA; bundle products list their contents; description renders CMS rich text with correct semantics |
| Cart                              | P0       | Line items, quantity stepper, remove, promo code, subtotal/discount/total                        | Cart persists across a session reload; invalid promo codes show a clear inline error                                        |
| Checkout (single flow)            | P0       | Name + email → email OTP → auto-created account → address → Cashfree payment                     | No separate "sign up" screen is ever shown; a failed OTP or failed payment can be retried without losing entered data       |
| Payments (Cashfree)               | P0       | UPI, cards, netbanking via Orders API + hosted Web Checkout, webhook-confirmed                    | Order only moves to "Confirmed" after the `PAYMENT_SUCCESS_WEBHOOK` webhook is verified, not on client-side redirect alone   |
| Order confirmation + status pages | P0       | Order summary right after payment; status timeline (Placed→Confirmed→Shipped→Delivered/Cancelled/Refunded) | Status page is reachable via a shareable order link and reflects the latest owner-updated status                      |
| Passwordless login + order history | P0      | Returning customer logs in with email OTP to view past orders                                    | No password is ever set or requested; login re-uses the same Better Auth OTP mechanism as checkout                          |
| Discount / promo codes            | P1       | Applied at cart or re-applied at checkout                                                        | A code past its validity window or usage limit is rejected with a specific reason, not a generic error                      |
| Bundles                           | P1       | Modeled as a product type, not a separate system                                                 | A bundle product shows its component items on the PDP and in cart/order line items                                          |
| CMS (Sanity Studio)               | P0       | Owner self-serve for products, categories, bundles, banners, promo codes, read-only order view    | Owner can add a product end-to-end (fields + images) in under 5 minutes without developer help                              |
| Legal & policy pages              | P1       | Privacy Policy, Terms of Service, Shipping & Returns                                              | Linked from the footer on every page; content editable by the owner or hardcoded copy at minimum for launch                 |
| System states (404/500/offline)   | P1       | Branded fallback pages instead of default framework errors                                       | Each state offers a way back to the storefront (home link / retry)                                                          |

---

## 6. Timeline & Milestones

No fixed launch date was specified — the plan below is phased so the store can go live in stages rather than as one large release. See `PLAN.md` for the detailed technical build plan.

| Milestone       | Description                                                                           |
| --------------- | ------------------------------------------------------------------------------------- |
| Foundation      | Next.js + Tailwind + shadcn scaffold, design tokens, Sanity schema, Better Auth setup |
| Core commerce   | Product listing/detail, cart, checkout flow, Cashfree integration                     |
| Orders & CMS    | Order status pages, promo codes, full CMS content types, order history                |
| Polish & launch | Responsive QA, accessibility pass, empty/error/loading states, soft launch            |

---

## 7. Dependencies & Risks

### Assumptions & Dependencies

- Owner is not currently GST-registered; Cashfree onboarding will use PAN + bank account as a sole proprietor (permitted below the GST threshold), and checkout will issue simple receipts, not tax invoices, until GST registration happens
- Product photography is supplied by the owner
- Shipping/logistics are handled manually by the owner; order status is updated by hand in the CMS rather than pulled from a courier API in v1
- Single currency (INR), single region (India) for v1
- v1 runs entirely on free tiers (Vercel, Neon, Sanity, Resend) plus Cashfree's pay-per-transaction fee — there is no fixed monthly cost until the store has actual sales
- Phone number is collected at checkout as a plain delivery-contact field, not used for authentication, so no SMS OTP provider is needed for v1
- SMS OTP (e.g. via MSG91) is deferred to a later phase once revenue justifies the recurring per-message cost; Better Auth's architecture supports adding it later without restructuring auth

### Key Risks

| Risk                                                             | Mitigation                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Email OTP lands in spam / delivery delays                         | Verified Resend sending domain from day one; monitor deliverability; add SMS OTP once revenue justifies it |
| Cashfree onboarding delay without GSTIN                           | Apply as sole proprietor with PAN; issue receipts, not tax invoices, until GST registration                |
| Owner breaks storefront layout via CMS                            | Constrain Sanity schema (required alt text, fixed banner aspect ratios, no free-form HTML)                 |
| Cart/session continuity when checkout auto-creates an account mid-flow | Persist cart server-side keyed to session cookie pre-auth, merge into user's cart on account creation |
| Manual order status updates forgotten by a solo owner              | CMS/dashboard view sorted by "oldest un-updated order"                                                     |

→ See [ARCHITECTURE.md](./ARCHITECTURE.md) for the security model and deployment topology these risks assume.

---

## 8. Open Questions

- When to add phone/SMS OTP as a second login method (post-revenue) and which provider (MSG91 recommended for INR pricing; Twilio as an international fallback)
- Return/refund policy specifics, which determine the exact rules for the "Cancelled" and "Refunded" order states
- Whether/when courier tracking (e.g. Shiprocket, Delhivery API) gets added post-v1
- When GST registration happens, checkout and CMS need an "invoice mode" update

---

## 9. Tech Stack

| Layer                | Choice                                          | Notes                                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework            | Next.js (App Router) + TypeScript               | SSR/ISR for product pages, API routes for backend logic                                                                                                                                                                                               |
| Styling / UI         | Tailwind CSS + shadcn/ui                        | Design tokens map to the burgundy/beige/gold palette (see `DESIGN.md`)                                                                                                                                                                                |
| CMS                  | Sanity                                          | Content-only: products, categories, bundles, banners, promo definitions. Fetched via `next-sanity` + GROQ, images via Sanity's image URL builder                                                                                                      |
| Auth                 | Better Auth                                     | Passwordless, email OTP plugin. Account is silently created the moment a customer enters name + email at checkout — no separate sign-up screen. Phone number is captured separately as a plain delivery-contact field, not used for auth in v1        |
| Transactional email  | Resend + React Email                            | Order confirmation, shipping updates, and email OTP for login — free tier (3,000 emails/month) covers v1 entirely                                                                                                                                     |
| Payments             | Cashfree                                        | Orders API + hosted Web Checkout; UPI, cards, netbanking; webhook-driven payment confirmation, refund sync, and incident-aware pausing. No fixed fee — only a per-transaction charge, so effectively free until there are sales. Onboarding possible with just PAN (no GSTIN required below threshold) |
| Database             | Neon (Postgres) + Drizzle ORM                   | Free tier. Holds transactional data: users (Better Auth tables), orders, payments, promo redemptions. Sanity is intentionally kept content-only, since it isn't built for high-write transactional data                                               |
| Validation           | Zod                                             | Shared schema validation across forms and API routes                                                                                                                                                                                                  |
| Client data/state    | TanStack Query                                  | Cart sync, order status polling                                                                                                                                                                                                                       |
| Forms                | React Hook Form                                 | Checkout and CMS-adjacent forms                                                                                                                                                                                                                       |
| Hosting              | Vercel (app) + Neon (DB) + Sanity (managed CMS) | All free tiers, sufficient for a small business at launch                                                                                                                                                                                             |
| _(Deferred)_ SMS OTP | MSG91 or Twilio                                 | The only paid line item in the stack. Not needed for v1 since auth is email-only; add later as a second login method once revenue justifies the per-message cost                                                                                      |

**Architecture note:** Sanity owns _content_ (what's editable by the owner without touching data integrity — products, banners, promo rules). Postgres owns _transactions_ (what must be consistent and queryable — users, orders, payments). This split keeps the CMS simple for a non-technical owner while keeping order data reliable.

**Cost note:** With this configuration, v1 runs at $0 fixed cost — the only spend is Cashfree's per-transaction fee, which only applies once a sale actually happens.
