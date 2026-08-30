# API Specification — Tanvira

**Version:** 1.0
**Date:** August 29, 2026
**Status:** Draft

Single source of truth for all endpoint contracts. These are Next.js **Route Handlers** (`app/api/**/route.ts`) inside the same app as the frontend — there is no separate backend service. Product reads that don't need a dedicated endpoint (e.g. the PLP/PDP itself) are fetched directly in Server Components via `lib/sanity`; the endpoints below exist specifically for client-triggered mutations, webhook receivers, and anything TanStack Query polls or mutates from Client Components.

---

## Base URL & Auth

- **Base URL:** `/api` (same origin as the app — no separate API domain).
- **Auth:** Better Auth session cookie, set after email-OTP verification. Route Handlers that require a session read it via Better Auth's server helper; there is no separate JWT issued to the client. Endpoints marked "Auth: session" reject with `401` if no valid session cookie is present.
- **Validation:** every request body is parsed with a Zod schema before use; a failing parse returns `400` with the error envelope below (see [ARCHITECTURE.md](./ARCHITECTURE.md) § Security Model).

---

## Endpoints

### Auth

| Method | Path              | Description                                             | Auth?   | Request Body                              | Response                          |
| ------ | ------------------ | ---------------------------------------------------------- | ------- | ---------------------------------------------- | -------------------------------------- |
| `*`    | `/api/auth/[...all]` | Better Auth's own handler — OTP request/verify, session, sign-out | varies  | Better Auth-defined (email-OTP plugin)          | Better Auth-defined                     |

### Checkout

Checkout's account creation is **not** a custom endpoint — it reuses Better Auth's own email-OTP plugin routes directly (mounted under `/api/auth/[...all]`, see § Auth above), called from the client via `authClient`:

| Better Auth call                                   | Path (internal)                        | Description                                                        |
| ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })` | `POST /api/auth/email-otp/send-verification-otp` | Sends the 6-digit OTP via Resend                                          |
| `authClient.signIn.emailOtp({ email, otp })`           | `POST /api/auth/sign-in/email-otp`         | Verifies the OTP; silently creates the account on first success (`disableSignUp: false`) — no separate "sign up" screen is ever shown |

This avoids re-implementing OTP generation/expiry/attempt-limiting logic Better Auth already provides — see [ARCHITECTURE.md](./ARCHITECTURE.md) § Security Model.

### Orders

| Method | Path                | Description                                                                    | Auth?    | Request Body                                                                                     | Response                                                                 |
| ------ | --------------------- | ------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `POST` | `/api/orders`          | Creates an order (status=`placed`) and a Cashfree order for payment; checks Cashfree's live incident status first and returns `503` while a HIGH-impact incident is active | session  | `{ items: [{ productId, qty, price }], promoCode?: string, shippingAddress: object }`                    | `201 { orderId: string, paymentSessionId: string, total: number }`                |
| `GET`  | `/api/orders/:id`      | Fetches an order's detail and status timeline                                          | session* | —                                                                                                        | `200 { id, status, items, total, timeline: [{status, changedAt}] }` or `404`     |
| `GET`  | `/api/orders`          | Lists the current user's orders, newest first, for Order History                       | session  | — (query: `?cursor=` for pagination)                                                                     | `200 { orders: [...], nextCursor: string \| null }`                             |

\* Order Status is reachable via a shareable link ([PRD.md](./PRD.md) § Feature List) — a valid order ID is sufficient to view status; only Order History requires a session tied to that order's owner.

### Promo Codes

| Method | Path                 | Description                                            | Auth?  | Request Body                     | Response                                                                 |
| ------ | ---------------------- | ----------------------------------------------------------- | ------ | --------------------------------------- | ------------------------------------------------------------------------------ |
| `POST` | `/api/promo/validate`  | Validates a promo code against validity window and usage limit | none   | `{ code: string, cartTotal: number }`     | `200 { valid: true, discountType, value }` or `200 { valid: false, reason: string }` |

### Webhooks

| Method | Path                        | Description                                                        | Auth?              | Request Body                             | Response          |
| ------ | ----------------------------- | ------------------------------------------------------------------------ | ------------------- | ----------------------------------------------- | ----------------------- |
| `POST` | `/api/webhooks/cashfree`       | Receives Cashfree payment/refund events; verifies signature before processing     | Cashfree signature headers (`x-webhook-signature`, `x-webhook-timestamp`) | `{ type: string, data: object }` (Cashfree's schema) | `200` (ack) or `400` if signature invalid |

Handled payment events: `PAYMENT_SUCCESS_WEBHOOK` (→ Order status `confirmed`, insert `OrderStatusHistory` row per [DB_SCHEMA.md](./DB_SCHEMA.md)), `PAYMENT_FAILED_WEBHOOK`/`PAYMENT_USER_DROPPED_WEBHOOK` (→ surfaced to the customer as a retryable error at Checkout Step 3, per [DESIGN.md](./DESIGN.md) § Screen Descriptions), `REFUND_STATUS_WEBHOOK` (→ Order status `refunded`, stores `refundId`/`refundedAmount`).

---

## Error Codes

Standard error envelope for all non-2xx responses:

```json
{ "error": { "code": "string", "message": "string" } }
```

| HTTP Status | `code`               | When                                                            |
| ------------ | ---------------------- | -------------------------------------------------------------------- |
| `400`         | `validation_error`      | Request body fails Zod validation                                     |
| `401`         | `unauthorized`          | Missing/invalid session where one is required, or OTP verification failed |
| `404`         | `not_found`             | Order, product, or resource ID does not exist                          |
| `409`         | `promo_limit_reached`   | Promo code's `usageLimit` already exhausted                            |
| `422`         | `promo_invalid`         | Promo code expired, not yet valid, or inactive                         |
| `400`         | `webhook_signature_invalid` | Cashfree webhook signature verification failed                    |
| `503`         | `payment_incident`      | A HIGH-impact Cashfree incident is active — new orders are paused        |
| `500`         | `internal_error`        | Unhandled server-side failure                                          |

---

## Pagination

Cursor-based, matching [DB_SCHEMA.md](./DB_SCHEMA.md) § Query Optimisation Notes. Applies to `GET /api/orders` (Order History).

- Request: `?cursor=<opaque-string>&limit=<n>` (default `limit=10`).
- Response includes `nextCursor: string | null` — `null` means no further pages.
- The cursor encodes `(createdAt, id)` from the last row of the previous page, matching the composite index on `orders.userId, orders.createdAt DESC`.
