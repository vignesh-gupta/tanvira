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

| Method | Path                           | Description                                                                 | Auth?   | Request Body                                                   | Response                                       |
| ------ | -------------------------------- | -------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| `POST` | `/api/checkout/create-account`    | Verifies email OTP and silently creates (or finds) the Better Auth account        | none    | `{ name: string, email: string, otp: string }`                        | `201 { userId: string }` or `401` if OTP invalid     |

### Orders

| Method | Path                | Description                                                                    | Auth?    | Request Body                                                                                     | Response                                                                 |
| ------ | --------------------- | ------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `POST` | `/api/orders`          | Creates an order (status=`placed`) and a Razorpay order for payment                    | session  | `{ items: [{ productId, qty, price }], promoCode?: string, shippingAddress: object }`                    | `201 { orderId: string, razorpayOrderId: string, total: number }`                |
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
| `POST` | `/api/webhooks/razorpay`       | Receives Razorpay payment events; verifies signature before processing     | Razorpay signature header | `{ event: string, payload: object }` (Razorpay's schema) | `200` (ack) or `400` if signature invalid |

Handled events: `payment.captured` (→ Order status `confirmed`, insert `OrderStatusHistory` row per [DB_SCHEMA.md](./DB_SCHEMA.md)), `payment.failed` (→ surfaced to the customer as a retryable error at Checkout Step 3, per [DESIGN.md](./DESIGN.md) § Screen Descriptions).

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
| `400`         | `webhook_signature_invalid` | Razorpay webhook signature verification failed                    |
| `500`         | `internal_error`        | Unhandled server-side failure                                          |

---

## Pagination

Cursor-based, matching [DB_SCHEMA.md](./DB_SCHEMA.md) § Query Optimisation Notes. Applies to `GET /api/orders` (Order History).

- Request: `?cursor=<opaque-string>&limit=<n>` (default `limit=10`).
- Response includes `nextCursor: string | null` — `null` means no further pages.
- The cursor encodes `(createdAt, id)` from the last row of the previous page, matching the composite index on `orders.userId, orders.createdAt DESC`.
