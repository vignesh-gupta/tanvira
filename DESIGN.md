# Design Document — Tanvira

**Version:** 1.0
**Date:** August 29, 2026
**Status:** Draft

---

## 1. Design Principles
- **Quiet luxury** — generous whitespace, restrained ornamentation, let product photography carry the page
- **Frictionless commerce** — every extra tap between "want it" and "bought it" is a bug, especially at checkout
- **Mobile-first** — most gifting/everyday-wear shoppers browse and buy from a phone
- **Owner-editable, not owner-breakable** — CMS content types are structured so the owner can't accidentally break page layout
- **Accessible by default** — jewellery photography needs strong contrast for text overlays; never sacrifice legibility for aesthetics

---

## 2. Design Tokens

### Color Palette
Derived from the Tanvira logo (burgundy background, cream wordmark, gold diamond mark). The storefront itself uses a light beige base so product photography reads clearly, with burgundy and gold as accent colors — the logo's dark palette is reserved for the header/footer and brand moments.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#5B0E22` (burgundy) | CTA buttons, links, active states |
| `--color-secondary` | `#C8A24C` (gold) | Accents, badges, dividers, hover underlines |
| `--color-background` | `#F7F1E8` (beige) | Page background |
| `--color-surface` | `#FFFDF8` (warm off-white) | Cards, modals, product tiles |
| `--color-text-primary` | `#2A1015` (deep burgundy-black) | Body copy, headings |
| `--color-text-secondary` | `#7A6A5D` (warm taupe) | Captions, meta text, secondary labels |
| `--color-error` | `#B3261E` | Errors, destructive actions (e.g. remove from cart) |
| `--color-success` | `#3F6E4E` | Order confirmed, payment success states |
| `--color-header-bg` | `#5B0E22` (burgundy) | Header/footer, matching the logo's native background |
| `--color-header-text` | `#F4E8D3` (cream) | Text/icons on the burgundy header/footer |

### Typography
| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `--font-heading-xl` | Playfair Display (serif) | 40–56px | 500–600 | Hero, page titles — echoes the logo's serif wordmark |
| `--font-heading-lg` | Playfair Display | 24–32px | 500 | Section headers, product name on PDP |
| `--font-body` | Inter | 15–16px | 400 | Body copy, product descriptions, form labels |
| `--font-caption` | Inter | 12–13px | 400, letter-spacing 0.05em | Labels, tags, order status pills — mirrors the tagline's spaced-out caps treatment |

### Spacing & Radius
- Base unit: 4px (scale: 4, 8, 12, 16, 24, 32, 48, 64)
- Border radius: `--radius-sm` 4px (inputs, badges), `--radius-md` 8px (cards, buttons), `--radius-lg` 16px (modals, hero panels)

---

## 3. User Flows

### Flow 1: Browse → Purchase (primary flow)
```
Landing → Product Listing → Product Detail → Add to Cart → Cart
   → Checkout (name + email → email OTP → auto-create account) → Address (incl. phone as contact)
   → Payment (Razorpay) → Order Confirmation → Order Status page
     ↓ (payment fails)                    ↓ (OTP requested for login later)
   Retry payment on Checkout          Returning-customer email OTP login → Order History
```
**Notes:**
- No account/sign-up screen exists as a separate step. The moment the customer submits name + email at checkout and verifies the OTP, Better Auth silently creates the account in the background; the customer only ever sees "checkout," never "sign up."
- Auth is email-only for v1 (keeps the stack free — no SMS provider needed). The OTP is sent and verified via Resend before payment, since it's the account identifier.
- Phone number is still collected, but on the Address step, purely as a delivery-contact field — it does not gate checkout and isn't used for login.
- Promo code entry sits on the Cart page, re-appliable at Checkout.

### Flow 2: Returning Customer — View Order Status
```
Landing/Header → "Track Order / Login" → Enter email
   → OTP sent (via Resend) → OTP verified → Order History → Order Status detail
     ↓ (wrong OTP)
   Retry / resend OTP (rate-limited)
```
**Notes:** Same Better Auth email-OTP mechanism as checkout — there is only one auth system, just two entry points (checkout auto-creates, header login re-authenticates).

### Flow 3: Owner — Manage Catalog (CMS)
```
Sanity Studio login → Products → Create/Edit product
   → Write rich-text description (material, size/length, care details), set images, price, bundle toggle
   → Publish → Reflected on storefront via ISR/revalidation
```
**Notes:** Studio uses Sanity's default UI (no custom admin build) to keep this fast to ship and free to maintain.

---

## 4. Screen Descriptions / Wireframe Notes

### Screen: Landing
**Purpose:** First impression, brand tone-setting, route into collections
**Key elements:**
- Hero banner (owner-editable via CMS: image, headline, CTA link)
- Featured/curated collection strip (e.g. "Gifting Edit," "Everyday Wear")
- Bestsellers or new-arrivals grid
- Brand story strip (short, optional CMS block)
- Footer: contact/WhatsApp, socials, policies

**States:** Default | Loading (skeleton banner + cards) | Error (fallback static hero if CMS fetch fails)

### Screen: Product Listing (PLP)
**Purpose:** Browse and filter the catalog
**Key elements:**
- Category filter, price range filter
- Product grid (image, name, price)
- Sort (price, newest)

**States:** Default | Loading (skeleton grid) | Empty (no matches — "no items in this filter") | Error

### Screen: Product Detail (PDP)
**Purpose:** Convert interest into an add-to-cart
**Key elements:**
- Image gallery
- Name, price
- Rich-text description (renders CMS-authored content: material, size/length, care instructions — all part of the same content block, no separate selector UI)
- Bundle contents list (if product is a bundle)
- Add to Cart CTA (sticky on mobile)
- Stock status

**States:** Default | Loading | Out of stock (CTA disabled, "Notify me" optional post-v1) | Error

### Screen: Cart
**Purpose:** Review and adjust items before checkout
**Key elements:**
- Line items with quantity stepper, remove
- Promo code input
- Subtotal, discount, total
- "Proceed to Checkout" CTA

**States:** Default | Empty ("Your cart is empty" + browse CTA) | Loading (on quantity update) | Error (invalid promo code messaging)

### Screen: Checkout
**Purpose:** Single-flow conversion — details, address, payment
**Key elements:**
- Step 1: Name + Email + OTP verification (auto-creates account on submit)
- Step 2: Shipping address (includes phone as a plain contact field)
- Step 3: Order summary + Razorpay payment trigger
- Promo code re-entry point

**States:** Default | Loading (during OTP send / payment processing) | Error (OTP invalid, payment failed — both must offer a clear retry) | Success (redirects to Order Confirmation)

### Screen: Order Confirmation
**Purpose:** Reassure the customer the order succeeded, give a reference point
**Key elements:**
- Order ID, summary, delivery address, estimated timeline
- Link to Order Status page
- "We've emailed/texted your confirmation" note

**States:** Default | Error (payment succeeded but confirmation fetch failed — show order ID with a manual "view order" link/support contact)

### Screen: Order Status
**Purpose:** Let a customer check where their order is
**Key elements:**
- Status timeline: Placed → Confirmed → Shipped → Delivered (or Cancelled / Refunded as terminal states)
- Order items, address, payment summary
- Support/contact CTA for issues

**States:** Default | Loading | Error (order not found)

### Screen: Order History (Account)
**Purpose:** Logged-in customer's past orders
**Key elements:**
- List of past orders (date, status, total, link to detail)
- OTP-based login gate before this screen is reachable

**States:** Default | Empty (no past orders) | Loading | Error

---

## 5. Responsive & Mobile Considerations

| Breakpoint | Width | Layout notes |
|------------|-------|--------------|
| Mobile | < 640px | Single-column PLP/cart, sticky "Add to Cart" / "Pay Now" CTA bar, bottom-anchored primary actions, hamburger nav |
| Tablet | 640–1024px | 2-column PLP grid, cart as slide-over drawer |
| Desktop | > 1024px | 3–4 column PLP grid, cart as slide-over drawer, top nav with category links |

- Navigation: horizontal top nav (burgundy header) on tablet/desktop; hamburger + bottom sticky CTA on mobile
- Touch target minimum: 44×44px on all interactive elements
- Checkout steps stack vertically on mobile with clear step indicators — no multi-column forms below 640px
- Product image galleries: swipeable carousel on mobile, thumbnail strip on desktop

---

## 6. Accessibility Requirements
- **WCAG level target:** AA
- Color contrast: burgundy-on-beige and cream-on-burgundy combinations to be verified at 4.5:1 minimum for body text, 3:1 for large text (gold accent is decorative only — never used for text needing contrast guarantees)
- All interactive elements keyboard-navigable, including cart quantity steppers, and rich-text description content must use proper heading/list semantics (not just visual styling) for screen readers
- Screen reader support: semantic HTML, `aria-label`s on icon-only buttons (cart, remove, filter toggles)
- Focus indicators: visible focus ring using `--color-secondary` (gold) on all focusable elements
- Alt text required for all product and banner images (enforced as a required CMS field in Sanity schema, not just a convention)
- Order status timeline must be readable by screen readers as a sequence, not just visually implied by icon position

---

## 7. API / Data Contracts

### Endpoint: `GET /api/products`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Sanity document ID |
| `name` | string | yes | |
| `slug` | string | yes | |
| `price` | number | yes | In paise (INR) |
| `images` | string[] | yes | Sanity image URLs |
| `description` | portable text (rich text) | yes | Authored in CMS; includes material, size/length, care details — no separate variant fields |
| `isBundle` | boolean | yes | |
| `stock` | number | yes | |

### Endpoint: `POST /api/checkout/create-account`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | |
| `email` | string | no* | *one of email/phone required |
| `phone` | string | no* | |
| `otp` | string | conditional | required if phone provided |

### Endpoint: `POST /api/orders`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | string | yes | From Better Auth session |
| `items` | object[] | yes | productId, qty, price |
| `promoCode` | string | no | |
| `shippingAddress` | object | yes | |
| `razorpayOrderId` | string | yes | Created before payment trigger |

### Endpoint: `GET /api/orders/:id`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | |
| `status` | enum | yes | `placed`, `confirmed`, `shipped`, `delivered`, `cancelled`, `refunded` |
| `items` | object[] | yes | |
| `total` | number | yes | |
| `timeline` | object[] | yes | status + timestamp pairs |

### Webhook: `POST /api/webhooks/razorpay`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `event` | string | yes | e.g. `payment.captured`, `payment.failed` |
| `payload` | object | yes | Razorpay payment/order payload |

---

## 8. Component Inventory (reference)
- [ ] Button (primary/burgundy, secondary/outline, ghost, destructive)
- [ ] Input (text, phone [contact-only, non-auth], OTP — 6-digit segmented input for email verification)
- [ ] Product Card (image, name, price, badge for "bundle"/"sale")
- [ ] Cart Drawer / Line Item row with quantity stepper
- [ ] Rich Text Renderer (Sanity Portable Text → styled description block on PDP)
- [ ] Order Status Timeline (stepper component)
- [ ] Status Badge/Pill (per order state, color-coded)
- [ ] Promo Code Input (with apply/remove state)
- [ ] Modal / Dialog
- [ ] Toast / Notification (order placed, promo applied, errors)
- [ ] Header Nav (burgundy, logo, cart icon with count, login/account)
- [ ] Footer (links, contact, socials)
- [ ] Image Gallery/Carousel (PDP)
- [ ] Skeleton loaders (PLP grid, PDP, cart)

---

## 9. Open Design Questions
- Exact CMS-editable fields for the homepage hero (single hero vs. rotating carousel?)
- Portable Text schema for the description field — which block types/styles the owner needs (headings, bullet lists for "care instructions" vs. "specifications") without overcomplicating the editor
- Final choice of secondary sans font pairing for body text (Inter proposed, not yet confirmed against brand)
