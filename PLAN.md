# Plan — Storefront Fixes & Revamp

Fixes admin/checkout/auth issues found in the current build, then a UI/UX revamp. Phases run in order — each phase's UNTIL must be true before starting the next.

Admin role assignment is handled directly in the database by the owner — no seed/bootstrap script for it in this plan.

---

## Phase 1 — Auth & Session Fixes

GOAL: A logged-in customer sees their own signed-in state everywhere in the storefront, and admin ship/order-management works end to end for a user with `role = "admin"` set directly in Postgres.

UNTIL: With a DB-promoted admin account — `/admin/orders` loads, clicking Ship on a `confirmed` order with a tracking URL flips it to `shipped` and the customer's order page shows the tracking link; separately, the header shows an account/logout affordance (not a bare login link) for any signed-in session, verified by refreshing the page and confirming the state survives.

TASKS:
- [x] [components/storefront/header-nav.tsx](components/storefront/header-nav.tsx) — replace the always-visible login icon with account state driven by `authClient.useSession()`: signed-in state shows a 1-letter avatar with a dropdown (Admin Dashboard for admins, Profile, Orders & Addresses, Log out); login link only when signed out
- [x] Added a minimal [app/(storefront)/account/profile/page.tsx](app/(storefront)/account/profile/page.tsx) as the dropdown's Profile destination (read-only name/email — no new data model)
- [x] Manually promoted a test account to `role = "admin"` directly in Postgres, then clicked through `/admin/orders` → Ship dialog → confirmed `orders.status` transitions `confirmed` → `shipped` and `trackingUrl` is set (test fixture data cleaned up afterward)
- [x] Confirmed the customer-facing order page ([app/(storefront)/orders/[id]/page.tsx](app/(storefront)/orders/[id]/page.tsx)) renders the tracking link once shipped
- [ ] Verify cart-clear behavior against a real Cashfree webhook round trip (tunnel or deployed preview, per [TASKS.md](TASKS.md)) — **deferred**: no Cashfree credentials are configured in this environment (confirmed via `.env`); owner will verify this end-to-end separately

---

## Phase 2 — Checkout Flow Overhaul

GOAL: A signed-in customer with a saved address can complete checkout without re-entering name/email/OTP, can pick a saved address or add a new one, can navigate backward between checkout steps without losing entered data, and can edit or delete their saved addresses from their profile.

UNTIL: Signed-in customer with an existing address, starting from `/checkout`, lands directly on the address step (no OTP step), sees their saved address as a selectable card plus an "add new address" option, can go back from the payment step to the address step and see their selections preserved, and can complete a test order. Separately, from their account page the customer can edit an existing saved address (changes reflected immediately) and delete one (with a confirmation step), and cannot delete an address currently referenced by an order.

TASKS:
- [ ] [app/(storefront)/checkout/page.tsx](app/(storefront)/checkout/page.tsx) — skip Step 1 entirely when `authClient.useSession()` already has a user; start at the address step
- [ ] Add `GET /api/addresses` (list current user's saved addresses), `POST /api/addresses` (add new, respecting `isDefault`), `PATCH /api/addresses/[id]` (edit, scoped to the owning user), and `DELETE /api/addresses/[id]` (scoped to the owning user; reject with a clear error if the address is referenced by an order, since `orders.addressId` has `onDelete: "restrict"`, [db/schema.ts](db/schema.ts:79))
- [ ] Checkout address step — render saved addresses as selectable cards at the top (using existing `addresses.isDefault` column, [db/schema.ts](db/schema.ts:61)), with a form below to add a new one
- [ ] New account page — `app/(storefront)/account/addresses/page.tsx` — list saved addresses as cards with Edit and Delete actions; Edit opens the same address form used in checkout, Delete asks for confirmation before calling `DELETE /api/addresses/[id]`
- [ ] Link the new addresses page from the account/profile nav (alongside `account/orders`)
- [ ] [components/storefront/checkout-steps.tsx](components/storefront/checkout-steps.tsx) — make completed steps clickable, add an explicit Back button in [checkout/page.tsx](app/(storefront)/checkout/page.tsx), disabled once payment has been initiated (post `handlePay`)
- [ ] End-to-end click-through: signed-in customer, saved address, back-and-forth between steps, completed order, then edit and (attempt to) delete addresses from the account page

---

## Phase 3 — UI/UX Revamp

GOAL: Landing, PLP, PDP, cart, and checkout are redesigned mobile-first (≈99% of traffic is mobile — desktop is a secondary, scaled-up layout, not the design target) with jewelsmars.com-inspired layout and polish, staying within the existing burgundy/gold/beige theme tokens ([app/globals.css](app/globals.css), [DESIGN.md](DESIGN.md)). UI/layout only — no new features, backend models, or third-party integrations beyond what's explicitly listed below.

UNTIL: Each revamped page is designed and verified at mobile width first (build and screenshot-check at ~390px before ever checking desktop), renders correctly in both light content states (with and without data), uses only existing theme tokens (no new hardcoded colors), and is reviewed against reference screenshots before merging.

Reference: user-supplied jewelsmars.com screenshots (site itself is not reachable from this session's browser tool — blocked by policy).

**Settled scope decisions:**
- Bottom tab bar: exactly 4 tabs — Home, Shop, Cart, Account. No Wishlist or Collections tabs (not existing features).
- No chat/WhatsApp floating bubble widget. The existing static WhatsApp link in [footer.tsx](components/storefront/footer.tsx:27) stays as-is (plain link, not a chat feature).
- No wishlist heart icons on product cards, no EMI/"Buy on EMI" text, no newsletter signup form — all require new data models/integrations, out of scope for a UI-only phase.
- Header search icon: **omitted** — no product search feature exists.
- Discount pricing: add an optional `compareAtPrice` field to `sanity/schemaTypes/product.ts` so the owner can set an MRP for a strikethrough-price + discount-badge treatment on product cards (small schema addition, not a new feature).
- FAQ section: add as a static accordion component with hardcoded copy, no CMS model.
- "Shop by Trend" / homepage collection tile grid and the hero: both map directly onto the existing `banner.ts` schema's `collection` and `hero` placements ([sanity/schemaTypes/banner.ts](sanity/schemaTypes/banner.ts:48)) — no schema change needed, just new UI consuming existing content.
- Trust-badge marquee strip (e.g. "COD Available — Easy Returns"): static text in the component, no CMS-driven content.

TASKS:
- [ ] `sanity/schemaTypes/product.ts` — add optional `compareAtPrice` field (number, must be greater than `price` when set)
- [ ] Header — compact mobile pattern: hamburger menu, centered logo, cart icon with count badge (no search icon); keep desktop simple rather than stretching the mobile layout
- [ ] Add the fixed bottom tab bar (Home / Shop / Cart / Account) as a persistent mobile-viewport nav element, replacing/supplementing the current header nav's role
- [ ] Add a trust-badge marquee strip below the header (static copy)
- [ ] Redesign landing hero ([components/storefront/hero-carousel.tsx](components/storefront/hero-carousel.tsx)) — full-bleed mobile-first treatment, sourced from `banner` documents with `placement: "hero"`
- [ ] Add a homepage "collection tiles" section sourced from `banner` documents with `placement: "collection"`
- [ ] Redesign PLP grid ([app/(storefront)/products/page.tsx](app/(storefront)/products/page.tsx), [components/storefront/product-card.tsx](components/storefront/product-card.tsx)) — mobile grid density first; product card shows strikethrough `compareAtPrice` + discount badge when set, no wishlist icon, no EMI text
- [ ] Add a "View all" outlined-pill link pattern where a rail/grid links to the full PLP
- [ ] Redesign PDP ([app/(storefront)/products/[slug]/page.tsx](app/(storefront)/products/[slug]/page.tsx))
- [ ] Redesign cart ([app/(storefront)/cart/page.tsx](app/(storefront)/cart/page.tsx), [components/storefront/cart-line-item.tsx](components/storefront/cart-line-item.tsx))
- [ ] Redesign the reworked checkout from Phase 2 to match
- [ ] Restyle the account section (Phase 2's `account/orders` + new `account/addresses`) as a list-with-icons pattern (Overview / My Orders / My Address), matching the reference's account page layout
- [ ] Add a static FAQ accordion section (hardcoded copy)
- [ ] Restyle the footer to match the reference's structure (About / Quick Links / Store Policy columns) using only existing links (legal pages, existing WhatsApp link) — no newsletter signup
- [ ] Verify each page mobile-first (~390px) via the browser preview tool, then confirm desktop (≥1024px) still holds up, against the theme tokens in [app/globals.css](app/globals.css)
