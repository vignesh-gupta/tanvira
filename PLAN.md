# Implementation Plan — Tanvira

**Version:** 2.0
**Date:** August 29, 2026
**Status:** Draft

Ordered implementation plan following Database → Backend Test Contracts → Backend → Frontend Test Contracts → Frontend. This is a **navigation document** — it says what to build and in what order, and references the authoritative detail files rather than duplicating their content.

**Stack note:** Tanvira is a single Next.js application — there is no separate frontend/backend codebase. "Backend" in Phases 2–3 means Route Handlers and Server Actions living in `app/api/**` inside the same Next.js project as the pages; see [ARCHITECTURE.md](./ARCHITECTURE.md) § Module Breakdown. The stack (Next.js App Router + TypeScript, Tailwind + shadcn/ui, Sanity, Better Auth, Cashfree, Neon + Drizzle, Resend, Zod, TanStack Query, React Hook Form) is fixed — see [PRD.md](./PRD.md) § Tech Stack.

---

## Phase 1 — Database

Two data stores, per [ARCHITECTURE.md](./ARCHITECTURE.md): Sanity (content — products, categories, banners, promo definitions) and Neon Postgres via Drizzle (transactional — users, addresses, orders, order status history, promo redemptions).

Migration order (Postgres only — Sanity has no relational migrations):
1. `users`
2. `sessions`, `verification_tokens`
3. `addresses`
4. `orders`
5. `order_status_history`
6. `promo_redemptions`

→ See [DB_SCHEMA.md](./DB_SCHEMA.md) for the full high-level schema, indexes, and optimisation notes.

---

## Phase 2 — Backend Test Contracts (TDD)

> **Instruction for the builder agent**: Before writing any Route Handler or Server Action, define the test contract first — input/output and expected behaviour, no implementation. Use **Jest** for unit tests (`lib/db`, `lib/payments`, `lib/auth` helpers) and integration tests (Route Handlers under `app/api`). Create `describe`/`it` stubs only; leave bodies empty until Phase 3.

- Testing framework: **Jest** (unit + integration)
- Service/helper methods to cover:
  - `lib/payments` — create Cashfree order; verify webhook signature (valid/invalid/tampered payload); create Cashfree refund
  - `lib/auth` — OTP request; OTP verify (correct/incorrect/expired); silent account creation on first successful verify
  - `lib/db` — promo code validation against validity window + usage limit; order status transition (valid/invalid transitions)
- Route Handlers to cover (HTTP verb + path + expected success/error responses — no test code):
  - `POST /api/checkout/create-account` — 201 on valid OTP, 401 on invalid/expired OTP
  - `POST /api/orders` — 201 with Cashfree order created, 400 on invalid cart/address payload, 503 while a HIGH-impact incident is active
  - `GET /api/orders/:id` — 200 for existing order, 404 for unknown ID
  - `GET /api/orders` — 200 paginated list (session), 401 without session
  - `POST /api/promo/validate` — 200 valid/invalid shape per code state
  - `POST /api/webhooks/cashfree` — 200 on verified `PAYMENT_SUCCESS_WEBHOOK`/`PAYMENT_FAILED_WEBHOOK`/`REFUND_STATUS_WEBHOOK`, 400 on signature mismatch
- Minimum coverage target: ≥80% on all new/changed code.

→ See [API_SPEC.md](./API_SPEC.md) for the endpoint contracts your tests must validate.

---

## Phase 3 — Backend

- **Route Handlers** (`app/api/**/route.ts`): checkout account creation, orders CRUD, promo validation, Cashfree payment webhook receiver, Better Auth catch-all handler.
- **Server Actions**: cart mutations (add/update/remove) where a Route Handler isn't needed — cart persists server-side keyed to a session cookie before auth, merged into the account's cart at account creation (see [PRD.md](./PRD.md) § Key Risks).
- **Structure**: no feature-folder split by domain the way a separate Express service would have — Route Handlers live under `app/api/<resource>/route.ts`, shared logic lives in `lib/<concern>/` (`sanity`, `db`, `auth`, `payments`, `email`). See [ARCHITECTURE.md](./ARCHITECTURE.md) § Module Breakdown for the full tree.
- **Auth**: Better Auth email-OTP plugin — see [ARCHITECTURE.md](./ARCHITECTURE.md) § Security Model for the session/authorization model (Customer vs. Owner, the latter being Sanity's own auth, not Better Auth).
- **Business logic modules**:
  - `lib/payments` — Cashfree order creation, hosted Web Checkout trigger payload, webhook signature verification, refund creation, live incident status check
  - `lib/auth` — Better Auth config + email-OTP plugin wiring
  - `lib/db` — Drizzle schema/client, order status transitions, promo redemption tracking
  - `lib/email` — Resend client + React Email templates (OTP, order confirmation, shipping update)
  - `lib/sanity` — client, GROQ queries, image URL builder
- **Third-party integrations**: Cashfree (Orders API + hosted Web Checkout + payment/refund webhooks + live incident status API), Resend (email OTP + transactional email), Sanity (content), Neon (transactional data).

→ See [API_SPEC.md](./API_SPEC.md) for full endpoint contracts, request/response schemas, and error codes.

---

## Phase 4 — Frontend Test Contracts (TDD)

> **Instruction for the builder agent**: Before writing any component or page, define what should be tested — rendering, interactions, data states — no implementation. Use **Jest + React Testing Library** for unit/component tests and **Playwright** for E2E flows. Create `describe`/`it`/`test` stubs only; leave bodies empty until Phase 5.

- Unit/component testing framework: **Jest + React Testing Library**
- E2E testing framework: **Playwright**
- Components to cover (name — what to assert):
  - `ProductCard` — quick Add to Cart fires without navigation; bundle/sale badges render conditionally
  - `CartLineItem` — quantity stepper updates total; remove fires the correct mutation
  - `PromoCodeInput` — applied/error states render correctly per validation response
  - `CheckoutSteps` — current-step indicator matches the active checkout step
  - `OrderStatusTimeline` / `StatusBadge` — renders correct sequence/color per order status
  - `RichTextRenderer` — Portable Text renders with correct heading/list semantics
- E2E flows to cover (screen-to-screen path):
  - Browse → quick Add to Cart from PLP → Cart → Checkout → Payment (test mode) → Order Confirmation
  - Browse → PDP → Add to Cart → Cart → Checkout → Payment failure → retry → success
  - Returning customer → email OTP login → Order History → Order Status detail
  - Owner (out of scope for Playwright — covered by manual CMS QA, not automated E2E)
- Minimum coverage target: ≥80% unit/component; all critical E2E paths above covered.

→ See [DESIGN.md](./DESIGN.md) for the component catalogue and screen inventory your tests must cover.

---

## Phase 5 — Frontend

### Step 5.1 — Screen registry (from the built Figma file)

Figma file: `JesePETAAs901KcENKoKrT`. Node ID format below is `<fileKey>/<nodeId>`.

| Screen                | Route                       | Figma Node ID (Desktop)              | Figma Node ID (Mobile)                | Key Components                                  |
| ----------------------- | ----------------------------- | --------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Landing                 | `/`                            | `JesePETAAs901KcENKoKrT/51:2`             | `JesePETAAs901KcENKoKrT/69:60`             | Header Nav, Hero, Product Card, Footer                 |
| Login (email)           | `/login`                       | `JesePETAAs901KcENKoKrT/47:2`             | `JesePETAAs901KcENKoKrT/47:55`             | Input, Button                                          |
| OTP verification        | `/login` (step 2)              | `JesePETAAs901KcENKoKrT/50:80`            | `JesePETAAs901KcENKoKrT/50:148`            | Input (OTP segmented), Button                          |
| Product Listing (PLP)   | `/products`                    | `JesePETAAs901KcENKoKrT/80:322`           | `JesePETAAs901KcENKoKrT/80:475`            | Filter Rail, Product Card (quick Add to Cart)          |
| Product Detail (PDP)    | `/products/[slug]`             | `JesePETAAs901KcENKoKrT/80:601`           | `JesePETAAs901KcENKoKrT/80:710`            | Image Gallery, Rich Text Renderer, Product Card        |
| Cart                    | `/cart`                        | `JesePETAAs901KcENKoKrT/97:2`             | `JesePETAAs901KcENKoKrT/103:82`            | Cart Line Item, Promo Code Input                       |
| Checkout — Step 1       | `/checkout`                    | `JesePETAAs901KcENKoKrT/108:152`          | `JesePETAAs901KcENKoKrT/108:250`           | Input (OTP), Checkout Steps                            |
| Checkout — Step 2       | `/checkout`                    | `JesePETAAs901KcENKoKrT/109:296`          | `JesePETAAs901KcENKoKrT/109:394`           | Input, Checkout Steps                                  |
| Checkout — Step 3       | `/checkout`                    | `JesePETAAs901KcENKoKrT/112:448`          | `JesePETAAs901KcENKoKrT/112:532`           | Checkout Steps, Promo Code Input                        |
| Order Confirmation      | `/orders/[id]/confirmation`    | `JesePETAAs901KcENKoKrT/113:552`          | `JesePETAAs901KcENKoKrT/113:619`           | Status Badge                                            |
| Order Status            | `/orders/[id]`                 | `JesePETAAs901KcENKoKrT/117:624`          | `JesePETAAs901KcENKoKrT/117:719`           | Order Status Timeline, Status Badge, Breadcrumb        |
| Order History           | `/account/orders`              | `JesePETAAs901KcENKoKrT/121:2`            | `JesePETAAs901KcENKoKrT/121:94`            | Status Badge, Breadcrumb                                |
| Privacy Policy          | `/legal/privacy`               | `JesePETAAs901KcENKoKrT/122:2`            | `JesePETAAs901KcENKoKrT/122:70`            | Rich Text Renderer                                      |
| Terms of Service        | `/legal/terms`                 | `JesePETAAs901KcENKoKrT/122:128`          | —                                          | Rich Text Renderer                                      |
| Shipping & Returns      | `/legal/shipping-returns`      | `JesePETAAs901KcENKoKrT/122:196`          | —                                          | Rich Text Renderer                                      |
| 404 Not Found           | `/not-found`                   | `JesePETAAs901KcENKoKrT/123:2`            | `JesePETAAs901KcENKoKrT/123:51`            | Button (home link)                                      |
| 500 Server Error        | `/error`                       | `JesePETAAs901KcENKoKrT/123:90`           | `JesePETAAs901KcENKoKrT/123:141`           | Button (retry/home link)                                |
| Offline                 | (client-side, no route)        | `JesePETAAs901KcENKoKrT/123:182`          | —                                          | Button (retry)                                          |

### Step 5.2 — Theme

- Map [DESIGN.md](./DESIGN.md) § Design Tokens (color, typography, spacing, radius) into `tailwind.config.ts`.
- Create `src/styles/tokens.css` exporting CSS custom properties for the full token set.
- Do not build components until the theme is complete and verified against the Theming & Branding Figma page.

### Step 5.3 — Components (shared, then feature)

- `components/ui/` — shadcn primitives (Button, Input, Dialog, …).
- `components/storefront/` — build in this order, atoms → molecules → organisms, matching [DESIGN.md](./DESIGN.md) § Component Catalogue: Button, Input, Status Badge → Product Card, Cart Line Item, Promo Code Input, Checkout Steps → Header Nav, Footer, Image Gallery, Order Status Timeline.
- Note each component's Figma source as a code comment: `// Figma: https://figma.com/design/JesePETAAs901KcENKoKrT?node-id=<nodeId>`.

### Step 5.4 — Pages

Implement in navigation-flow order (see [DESIGN.md](./DESIGN.md) § User Flows Mermaid diagram): Landing → PLP → PDP → Cart → Checkout (3 steps) → Order Confirmation → Order Status → Login/OTP → Order History → Legal pages → System states.

| Page | Route | Figma Node Link | Key Components Used | TanStack Query Hooks |
| ---- | ----- | ---------------- | ---------------------- | ----------------------- |
| _(fill in as each page is implemented, using the Step 5.1 registry above)_ | | | | |

- Wire TanStack Query for all client-side data fetching/mutation (cart sync, order status polling).
- Implement loading/error/empty states per [DESIGN.md](./DESIGN.md) § Screen Descriptions for every async operation.
- Add error boundaries at the page level (`error.tsx` per route segment).

→ See [DESIGN.md](./DESIGN.md) for component catalogue, variants, and design tokens.

---

## Phase 6 — Cross-cutting

- CI/CD: run Jest + Playwright on every PR; block merge on failing tests or <80% coverage on changed files.
- `.env.example` covering: `CASHFREE_CLIENT_ID`, `CASHFREE_CLIENT_SECRET`, `CASHFREE_ENV`, `NEXT_PUBLIC_CASHFREE_ENV`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `DATABASE_URL` (Neon).
- Observability: structured logging on Route Handlers (esp. the Cashfree webhooks), error tracking for unhandled exceptions surfaced to `error.tsx`.
- Launch checklist: all [DESIGN.md](./DESIGN.md) screens implemented with default/loading/empty/error states; Cashfree sandbox test payment completes end-to-end; OTP login/checkout verified; owner can add a product/banner/promo code unaided; Lighthouse accessibility ≥90 on Landing, PLP, PDP, Checkout.

→ See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system diagram, deployment topology, and security model.

---

## Definition of Done (v1)

- [ ] All screens in [DESIGN.md](./DESIGN.md) implemented with default/loading/empty/error states
- [ ] Checkout completes end-to-end with a real Cashfree sandbox test payment (UPI + card)
- [ ] Account is created silently at checkout with no visible "sign up" step
- [ ] Returning customer can OTP-login and see order history
- [ ] Owner can add a product, publish a banner, and create a promo code without developer help
- [ ] Order status updates (manual, via CMS/dashboard) reflect correctly on the customer-facing status page
- [ ] Lighthouse accessibility score ≥ 90 on Landing, PLP, PDP, Checkout
