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
- [x] Verified cart-clear behavior against a real Cashfree webhook round trip: signed up a test customer, completed checkout with a real sandbox payment via the owner's devtunnel-exposed dev server, and confirmed the Cashfree webhook (signature-verified) flipped `orders.status` to `confirmed` and recorded `cashfreePaymentId`/`orderStatusHistory` asynchronously — independent of the client-side redirect — and that the cart cleared client-side. Test fixtures (order, address, user) cleaned up afterward.

---

## Phase 2 — Checkout Flow Overhaul

GOAL: A signed-in customer with a saved address can complete checkout without re-entering name/email/OTP, can pick a saved address or add a new one, can navigate backward between checkout steps without losing entered data, and can edit or delete their saved addresses from their profile.

UNTIL: Signed-in customer with an existing address, starting from `/checkout`, lands directly on the address step (no OTP step), sees their saved address as a selectable card plus an "add new address" option, can go back from the payment step to the address step and see their selections preserved, and can complete a test order. Separately, from their account page the customer can edit an existing saved address (changes reflected immediately) and delete one (with a confirmation step), and cannot delete an address currently referenced by an order.

TASKS:
- [x] [app/(storefront)/checkout/page.tsx](app/(storefront)/checkout/page.tsx) — skip Step 1 entirely when `authClient.useSession()` already has a user; start at the address step
- [x] Added `GET/POST /api/addresses` and `PATCH/DELETE /api/addresses/[id]` (scoped to the owning user; DELETE rejects with a clear 409 if the address is referenced by an order, per `orders.addressId`'s `restrict` constraint, [db/schema.ts](db/schema.ts:79)); shared isDefault-promotion logic lives in [lib/addresses.ts](lib/addresses.ts)
- [x] Checkout address step ([app/(storefront)/checkout/page.tsx](app/(storefront)/checkout/page.tsx)) — saved addresses render as selectable cards ([components/storefront/address-card.tsx](components/storefront/address-card.tsx)) with an "add new address" form below ([components/storefront/address-form.tsx](components/storefront/address-form.tsx), shared with the addresses page)
- [x] New account page — [app/(storefront)/account/addresses/page.tsx](app/(storefront)/account/addresses/page.tsx) — lists saved addresses with Edit (dialog, same address form) and Delete (confirmation dialog) actions, via [components/storefront/addresses-manager.tsx](components/storefront/addresses-manager.tsx)
- [x] Added [app/(storefront)/account/layout.tsx](app/(storefront)/account/layout.tsx) with a shared [components/storefront/account-nav.tsx](components/storefront/account-nav.tsx) (Profile / Orders / Addresses tabs) linking all three account pages
- [x] [components/storefront/checkout-steps.tsx](components/storefront/checkout-steps.tsx) — completed step circles are clickable; added an explicit "← Back to address" button on the payment step, disabled once payment has been initiated (`paying` state)
- [x] End-to-end click-through verified: signed-in customer with a saved address skips straight to the address step, selects the saved card, goes back from payment (selection preserved), and order creation resolves the address correctly; separately, a guest goes through OTP → new-address form → back (form data preserved); address edit and delete-when-unreferenced both work, and delete is correctly blocked (409 + toast) when the address is referenced by an order

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
- [x] `sanity/schemaTypes/product.ts` — added optional `compareAtPrice` field (number, custom-validated to be greater than `price` when set); propagated through `productCardFields`/`PRODUCT_BY_SLUG_QUERY` in [lib/sanity/queries.ts](lib/sanity/queries.ts)
- [x] Header ([components/storefront/header-nav.tsx](components/storefront/header-nav.tsx)) — compact mobile pattern: hamburger menu (Shop / Admin / Log out — Home/Cart/Account live in the bottom nav) with a centered logo and cart icon w/ badge; desktop keeps the previous inline nav + avatar dropdown, no search icon anywhere
- [x] Added [components/storefront/bottom-nav.tsx](components/storefront/bottom-nav.tsx) — fixed Home/Shop/Cart/Account tab bar, mobile-only (`sm:hidden`), wired into [app/(storefront)/layout.tsx](app/(storefront)/layout.tsx) with `pb-16` on `<main>` so content isn't hidden behind it
- [x] Added [components/storefront/trust-marquee.tsx](components/storefront/trust-marquee.tsx) (static copy, CSS marquee keyframe in [app/globals.css](app/globals.css), respects `prefers-reduced-motion`)
- [x] Redesigned landing hero ([components/storefront/hero-carousel.tsx](components/storefront/hero-carousel.tsx)) — shorter min-height on mobile (`min-h-[60vh] sm:min-h-[70vh]`), still full-bleed and sourced from `hero`-placement banners
- [x] Added a "Shop by Trend" homepage tiles section ([app/(storefront)/page.tsx](app/(storefront)/page.tsx)) — horizontal-scroll rounded tiles on mobile, grid on desktop, sourced from `collection`-placement banners
- [x] Redesigned PLP grid and [components/storefront/product-card.tsx](components/storefront/product-card.tsx) — tighter mobile gap/padding, discount badge + strikethrough `compareAtPrice` when set, no wishlist icon, no EMI text
- [x] Added [components/storefront/view-all-pill.tsx](components/storefront/view-all-pill.tsx) — outlined pill with arrow, used on the homepage Bestsellers section
- [x] Redesigned PDP ([app/(storefront)/products/[slug]/page.tsx](app/(storefront)/products/[slug]/page.tsx)) — discount badge/strikethrough price, tightened mobile spacing
- [x] Redesigned cart ([app/(storefront)/cart/page.tsx](app/(storefront)/cart/page.tsx), [components/storefront/cart-line-item.tsx](components/storefront/cart-line-item.tsx)) — mobile-first spacing/rounding polish
- [x] Restyled the Phase 2 checkout to match (padding/rounding consistency; no logic changes)
- [x] Restyled the account section as a list-with-icons pattern ([components/storefront/account-nav.tsx](components/storefront/account-nav.tsx): Overview / My Orders / My Addresses, each with an icon and chevron)
- [x] Added a static FAQ accordion ([components/storefront/faq-accordion.tsx](components/storefront/faq-accordion.tsx), hardcoded copy, shadcn Accordion) on the homepage
- [x] Restyled the footer ([components/storefront/footer.tsx](components/storefront/footer.tsx)) — About / Quick Links / Store Policy columns, existing links only
- [x] Verified mobile-first (~390px, screenshot-checked) and desktop (1280px) for home, PLP, PDP, cart, checkout, and all three account pages; verified the discount-badge "with data" state by temporarily publishing a `compareAtPrice` on a real Sanity product and reverting afterward. **Known tooling limitation:** this session's browser tool hangs on click/type actions under viewport widths below 768px (mobile touch-emulation), even for plain links unrelated to any change here — so the mobile-only hamburger menu's dropdown open/close was verified structurally (correct button/aria attributes, identical `DropdownMenu` primitive already proven interactive via the desktop avatar dropdown) rather than by an actual mobile click. Worth a manual tap-test on a real device.
