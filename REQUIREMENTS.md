# Requirements — Tanvira

**Version:** 1.0
**Date:** August 29, 2026
**Status:** Draft

Distilled from the Figma design (screens, components, flows — see [DESIGN.md](./DESIGN.md)) and [PRD.md](./PRD.md). This is the raw requirements list; PRD.md carries the prioritized feature narrative for stakeholders.

---

## Overview

Tanvira is a Next.js storefront for a mass-market imitation/fashion jewellery brand. Customers browse a filterable catalog, add to cart directly from the listing grid or the product detail page, complete a single-flow checkout that silently creates an account via email OTP, pay via Razorpay, and track their order. The owner manages the entire catalog, promotions, and homepage content through Sanity Studio without developer involvement.

---

## Functional Requirements

1. The Landing page must render a CMS-editable hero (image, headline, CTA link), a featured/curated collection strip, and a bestsellers/new-arrivals grid.
2. The Product Listing Page (PLP) must support category and price-range filtering and sort by price/newest.
3. Every product card on the PLP must expose an Add to Cart control that adds the default configuration (qty 1) without navigating to the Product Detail Page (PDP).
4. Tapping a product card's image or name must navigate to its PDP.
5. The PDP must render an image gallery, name, price, a CMS-authored rich-text description (material, size/length, care details as one block — no separate variant selector), and bundle contents when the product is a bundle.
6. The PDP's Add to Cart CTA must be disabled when the product is out of stock.
7. The Cart must support quantity adjustment and removal of line items, and must persist across a session reload.
8. The Cart must accept a promo code and display subtotal, discount, and total; an invalid or expired code must show a specific inline error.
9. Checkout must collect name and email, verify an email OTP, and silently create a Better Auth account on success — no separate sign-up screen may ever be shown.
10. Checkout must collect a shipping address, including phone number captured purely as a delivery-contact field (not used for authentication).
11. Checkout must create a Razorpay order and trigger Checkout.js for UPI, card, and netbanking payment.
12. An order must not be marked "Confirmed" until the `payment.captured` Razorpay webhook is verified server-side — client-side redirect alone is not sufficient.
13. A failed OTP or failed payment must be retryable without the customer losing already-entered checkout data.
14. Order Confirmation must display the order ID, summary, delivery address, and estimated timeline, with a link to the Order Status page.
15. Order Status must display a timeline (Placed → Confirmed → Shipped → Delivered, or Cancelled/Refunded as terminal states), order items, address, and payment summary.
16. Returning customers must be able to log in with email OTP (no password) to view Order History.
17. Order History must list past orders with date, status, total, and a link to each order's detail.
18. Promo codes must be validated against their validity window and usage limit, with redemptions tracked to prevent reuse beyond the limit.
19. Bundle products must be modeled as a product type (not a separate system) and must list their component items on the PDP and in cart/order line items.
20. The owner must be able to manage products, categories, bundles, homepage banners/content, and promo codes via Sanity Studio, and view orders read-only.
21. Legal pages (Privacy Policy, Terms of Service, Shipping & Returns) must be reachable from the global footer.
22. 404, 500, and offline states must render branded fallback pages with a way back to the storefront (home link or retry).
23. The global header must show a live cart item count and a login/account entry point.

---

## Non-Functional Requirements

- **Performance:** Product pages use SSR/ISR so first-load content doesn't depend on client-side CMS fetches; skeleton loaders cover PLP grid, PDP, and cart while data loads.
- **Accessibility:** WCAG 2.1 AA. Minimum 4.5:1 contrast for body text and 3:1 for large text; all interactive elements keyboard-navigable; `aria-label`s on icon-only buttons; visible focus indicators; alt text required (enforced as a required Sanity field, not convention); order status timeline readable as a sequence by screen readers, not just implied by icon position.
- **Security:** Razorpay webhook payloads must be signature-verified before an order status changes. Session/auth state is owned entirely by Better Auth (email OTP) — no passwords are stored anywhere. All form and API-route input validated with Zod at the boundary.
- **Scalability:** v1 is deliberately sized for a solo-owner small business — Vercel + Neon + Sanity + Resend free tiers, Razorpay pay-per-transaction. No load beyond a small storefront's traffic is assumed; the stack should not need a rewrite if the business grows, but is not pre-optimized for scale it doesn't have yet.
- **Reliability:** Cart state persisted server-side keyed to a session cookie before authentication, merged into the customer's account cart at account creation, so nothing is lost mid-checkout.
- **Maintainability:** The owner must be able to add or update a product in the CMS in under 5 minutes without developer help.

---

## Assumptions

- Owner is not GST-registered at launch; Razorpay onboarding uses PAN + bank account as a sole proprietor, and checkout issues simple receipts, not GST tax invoices, until registration happens.
- Product photography is supplied by the owner.
- Shipping/logistics are handled manually; order status is updated by hand in the CMS rather than pulled from a courier API in v1.
- Single currency (INR), single region (India) for v1.
- Phone number collected at checkout is a delivery-contact field only — no SMS OTP provider is needed for v1, keeping the stack at $0 fixed cost.
- Sanity Studio uses its default UI; no custom admin build for v1.

---

## Open Questions

- When to add phone/SMS OTP as a second login method (post-revenue), and via which provider (MSG91 vs. Twilio).
- Exact return/refund policy specifics that determine the rules for "Cancelled" vs. "Refunded" order states.
- Whether/when courier tracking (e.g. Shiprocket, Delhivery API) gets added post-v1.
- What "invoice mode" changes are needed in checkout and CMS once GST registration happens.
- Exact CMS-editable fields for the homepage hero (single hero vs. rotating carousel).
- Portable Text schema for the description field — which block types/styles the owner needs (headings, bullet lists for "care instructions" vs. "specifications") without overcomplicating the editor.
- Whether legal page copy (Privacy/Terms/Shipping & Returns) is CMS-authored or hardcoded for launch — currently designed as static content with no defined loading/error state.
