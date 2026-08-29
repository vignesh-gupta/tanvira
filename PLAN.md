# Implementation Plan — Tanvira

**Version:** 1.0
**Date:** August 29, 2026
**Status:** Draft

Companion to `PRD.md` (what & why) and `DESIGN.md` (how it looks/flows). This document covers how it gets built: architecture, schema, folder structure, and phased delivery.

---

## 1. System Architecture

```
                     ┌─────────────────────┐
                     │      Next.js         │  (Vercel)
                     │  App Router + TS      │
                     └──────────┬───────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                       │
 ┌───────▼────────┐   ┌─────────▼─────────┐   ┌─────────▼─────────┐
 │  Sanity CMS     │   │  Neon Postgres     │   │  Razorpay          │
 │  (content)      │   │  + Drizzle ORM     │   │  (payments)        │
 │  products,      │   │  users (Better     │   │  Orders API +      │
 │  categories,    │   │  Auth), orders,    │   │  Checkout.js +     │
 │  banners,       │   │  payments, promo   │   │  webhooks          │
 │  promo defs     │   │  redemptions       │   └────────────────────┘
 └─────────────────┘   └────────────────────┘
                                │
                        ┌───────▼───────┐
                        │  Resend        │
                        │  (email +      │
                        │  email OTP)    │
                        └────────────────┘

  (Deferred, v2+): MSG91/Twilio SMS OTP as a second Better Auth
  login method once revenue justifies the per-message cost.
```

**Why split Sanity and Postgres:** Sanity is optimized for editorial content the owner touches by hand (products, banners, promo _definitions_). Orders, payments, and promo _redemptions_ need transactional guarantees and get written far more frequently than content changes — that belongs in Postgres via Drizzle, queried through Next.js API routes / server actions.

**v1 cost baseline:** Vercel, Neon, Sanity, and Resend free tiers plus Razorpay's per-transaction-only fee mean v1 has $0 fixed monthly cost. Auth is email-only (Resend OTP) specifically to avoid the one paid component in the stack, SMS delivery, until the business has revenue to justify it.

---

## 2. Data Model (high level)

### Sanity schemas (content)

- `product` — name, slug, description (Portable Text / rich text — includes material, size/length, care details, no separate variant fields), price, images[], isBundle, bundleItems[], category ref, stock
- `category` — name, slug
- `banner` — image, headline, CTA link, position/order
- `promoCode` — code, discountType (flat/percent), value, validFrom/validTo, usageLimit, isActive _(definition only — redemption count tracked in Postgres)_

### Postgres schema (transactional, via Drizzle)

- `users` — id, name, email, createdAt _(Better Auth manages this table; email is the sole auth identifier for v1)_
- `sessions`, `verificationTokens` _(Better Auth managed)_
- `addresses` — id, userId, line1, line2, city, state, pincode, phone _(phone lives here as a delivery-contact field, not on `users`)_
- `orders` — id, userId, status (enum), items (jsonb), promoCode, subtotal, discount, total, addressId, razorpayOrderId, razorpayPaymentId, createdAt
- `orderStatusHistory` — id, orderId, status, changedAt _(powers the order timeline UI)_
- `promoRedemptions` — id, promoCode, userId, orderId, redeemedAt

---

## 3. Folder Structure (proposed)

```
tanvira/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx                  # Landing
│   │   ├── products/page.tsx         # PLP
│   │   ├── products/[slug]/page.tsx  # PDP
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── orders/[id]/page.tsx      # Order status
│   │   └── account/orders/page.tsx   # Order history
│   ├── api/
│   │   ├── checkout/create-account/route.ts
│   │   ├── orders/route.ts
│   │   ├── orders/[id]/route.ts
│   │   ├── webhooks/razorpay/route.ts
│   │   └── auth/[...all]/route.ts    # Better Auth handler
│   └── studio/[[...tool]]/page.tsx   # Embedded Sanity Studio (optional; can also be standalone)
├── components/
│   ├── ui/                           # shadcn components
│   └── storefront/                   # ProductCard, CartDrawer, OrderTimeline, etc.
├── lib/
│   ├── sanity/                       # client, queries (GROQ), image builder
│   ├── db/                           # drizzle schema + client
│   ├── auth/                         # better-auth config, OTP adapters
│   ├── payments/                     # razorpay client + webhook verification
│   └── email/                        # resend client + React Email templates
├── drizzle/                          # migrations
└── sanity.config.ts
```

---

## 4. Build Phases

### Phase 1 — Foundation

- Next.js + TypeScript + Tailwind + shadcn scaffold, design tokens from `DESIGN.md` wired into `tailwind.config`
- Sanity project setup + schemas (product, category, banner, promoCode)
- Neon Postgres + Drizzle setup, initial migration (users/addresses/orders tables)
- Better Auth installed and configured with the email OTP plugin (Resend) — no SMS provider needed for v1, keeping the stack at $0 fixed cost
- Deploy skeleton to Vercel with all env vars wired

### Phase 2 — Core Commerce

- Landing page pulling banners/collections from Sanity
- PLP with filters, PDP rendering rich-text descriptions and bundle support
- Cart (client state + persisted, e.g. via cookie/localStorage synced to a server cart on login)
- Checkout flow: name + email → email OTP verification → Better Auth account auto-creation → address capture (phone collected here as a contact field)
- Razorpay integration: order creation, Checkout.js trigger, webhook handler for `payment.captured` / `payment.failed`

### Phase 3 — Orders & CMS Depth

- Order confirmation + order status pages with timeline component
- Order history page gated behind OTP login
- Promo code logic: validation, discount calculation, redemption tracking against `promoRedemptions`
- CMS: owner-facing order view (read-only sync from Postgres into a Studio custom view, or a simple `/studio` linked internal dashboard — decide based on Sanity's custom tool support)

### Phase 4 — Polish & Launch

- Responsive QA across mobile/tablet/desktop per `DESIGN.md` breakpoints
- Accessibility pass: contrast check, keyboard nav, alt text enforcement in Sanity schema
- Loading/empty/error states for every screen (per `DESIGN.md` §4)
- Transactional email templates finalized (order confirmation, shipping update)
- Soft launch → monitor Razorpay webhook reliability, OTP delivery rates, and CMS usability with the owner

---

## 5. Key Technical Risks & Mitigations

| Risk                                                                   | Mitigation                                                                                                                                                            |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email OTP landing in spam / delivery delays                            | Use Resend's verified sending domain setup from day one; monitor deliverability before launch; add SMS OTP (MSG91) as a second method once revenue justifies the cost |
| Razorpay onboarding delay without GSTIN                                | Apply early as sole proprietor with PAN; use manual receipts (not tax invoices) until GST registration                                                                |
| Owner accidentally breaking storefront layout via CMS                  | Constrain Sanity schema fields (required alt text, fixed banner aspect ratios, no free-form HTML)                                                                     |
| Cart/session continuity when checkout auto-creates an account mid-flow | Persist cart server-side keyed to session cookie before auth, merge into user's cart on account creation                                                              |
| Manual order status updates being forgotten by a solo owner            | Add a simple CMS/dashboard reminder view sorted by "oldest un-updated order"                                                                                          |

---

## 6. Definition of Done (v1)

- [ ] All screens in `DESIGN.md` implemented with default/loading/empty/error states
- [ ] Checkout completes end-to-end with a real Razorpay test payment (UPI + card)
- [ ] Account is created silently at checkout with no visible "sign up" step
- [ ] Returning customer can OTP-login and see order history
- [ ] Owner can add a product, publish a banner, and create a promo code without developer help
- [ ] Order status updates (manual, via CMS/dashboard) reflect correctly on the customer-facing status page
- [ ] Lighthouse accessibility score ≥ 90 on Landing, PLP, PDP, Checkout
