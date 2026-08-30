# Database Schema — Tanvira

**Version:** 1.0
**Date:** August 29, 2026
**Status:** Draft

Single source of truth for the data model. High-level only — tables, fields, keys, relationships. No SQL/DDL here; [PLAN.md](./PLAN.md) and [ARCHITECTURE.md](./ARCHITECTURE.md) reference this file instead of duplicating schema detail.

Per [ARCHITECTURE.md](./ARCHITECTURE.md), the data model is split across two stores:
- **Sanity** — content the owner edits by hand (products, categories, banners, promo *definitions*). No transactional guarantees needed; not covered by "Migration Order" below since Sanity schema types are content-defined, not relationally migrated.
- **Neon Postgres (via Drizzle ORM)** — transactional data that must stay consistent (users, addresses, orders, payments, promo *redemptions*).

---

## Entity Overview

| Entity              | Store    | Purpose                                                   | Key Relations                                  |
| -------------------- | -------- | ------------------------------------------------------------ | --------------------------------------------------- |
| Product               | Sanity   | Catalog item, incl. bundles                                    | belongs to Category; may reference other Products as bundle items |
| Category              | Sanity   | Catalog grouping for filtering/navigation                      | has many Products                                    |
| Banner                | Sanity   | Homepage hero/promo imagery, owner-editable                    | —                                                     |
| PromoCodeDefinition   | Sanity   | Discount rule definition (code, type, value, validity window)  | referenced by PromoRedemption (Postgres) by code     |
| User                  | Postgres | Customer account (Better Auth managed)                         | has many Addresses, Orders                           |
| Session / VerificationToken | Postgres | Better Auth session + email-OTP verification state       | belongs to User                                      |
| Address               | Postgres | Delivery address, incl. phone as a contact field               | belongs to User                                      |
| Order                 | Postgres | A placed order                                                  | belongs to User; belongs to Address; has many OrderStatusHistory entries |
| OrderStatusHistory    | Postgres | Timeline of status changes for an order                        | belongs to Order                                     |
| PromoRedemption       | Postgres | Record of a promo code being used on an order                  | belongs to User; belongs to Order                    |

---

## Schema Definitions

### Sanity — Product
```
Fields:
  - _id (Sanity document ID, PK)
  - name
  - slug (unique)
  - price (integer, paise/INR)
  - images (array of image refs)
  - description (Portable Text — material, size/length, care details as one rich-text block)
  - isBundle (boolean)
  - bundleItems (array of references → Product, only when isBundle)
  - stock (integer)
Relations:
  - belongs to Category (reference)
  - may reference many Products (bundleItems, self-referential)
```

### Sanity — Category
```
Fields:
  - _id (PK)
  - name
  - slug (unique)
Relations:
  - has many Products
```

### Sanity — Banner
```
Fields:
  - _id (PK)
  - image
  - headline
  - ctaLink
  - order (integer, controls display position)
```

### Sanity — PromoCodeDefinition
```
Fields:
  - _id (PK)
  - code (unique)
  - discountType (enum: flat, percent)
  - value (number)
  - validFrom (datetime)
  - validTo (datetime)
  - usageLimit (integer, nullable = unlimited)
  - isActive (boolean)
Relations:
  - referenced by PromoRedemption (Postgres) via `code`, not a hard FK across stores
```

### Postgres — User
```
Fields:
  - id (PK)
  - name
  - email (unique)
  - createdAt
Relations:
  - has many Addresses
  - has many Orders
Note: managed by Better Auth; email is the sole auth identifier for v1 (no password, no phone-based auth).
```

### Postgres — Session / VerificationToken
```
Fields (Better Auth managed, exact shape owned by the Better Auth schema):
  - id (PK)
  - userId (FK → User.id)
  - token / otp-related fields
  - expiresAt
Relations:
  - belongs to User
```

### Postgres — Address
```
Fields:
  - id (PK)
  - userId (FK → User.id)
  - line1
  - line2 (nullable)
  - city
  - state
  - pincode
  - phone (delivery-contact field, not used for auth)
Relations:
  - belongs to User
  - referenced by Order.addressId
```

### Postgres — Order
```
Fields:
  - id (PK)
  - userId (FK → User.id)
  - status (enum: placed, confirmed, shipped, delivered, cancelled, refunded)
  - items (jsonb: [{ productId, qty, price }])
  - promoCode (nullable, string)
  - subtotal
  - discount
  - total
  - addressId (FK → Address.id)
  - cashfreeOrderId
  - cashfreePaymentId (nullable until captured)
  - refundId (nullable)
  - refundedAmount (nullable)
  - createdAt
Relations:
  - belongs to User
  - belongs to Address
  - has many OrderStatusHistory
```

### Postgres — OrderStatusHistory
```
Fields:
  - id (PK)
  - orderId (FK → Order.id)
  - status (enum, same values as Order.status)
  - changedAt
Relations:
  - belongs to Order
Note: powers the Order Status timeline UI (see DESIGN.md § Order Status).
```

### Postgres — PromoRedemption
```
Fields:
  - id (PK)
  - promoCode (string, matches Sanity PromoCodeDefinition.code)
  - userId (FK → User.id)
  - orderId (FK → Order.id)
  - redeemedAt
Relations:
  - belongs to User
  - belongs to Order
Note: used to enforce Sanity's usageLimit without giving Sanity write access to transactional counts.
```

Note: incident/downtime state is **not** mirrored into Postgres — `POST /api/orders` calls Cashfree's `GET /incident?incident_status=ACTIVE&incident_impact=HIGH` live at order-creation time instead, since Cashfree already exposes that as a queryable API. No table, no webhook, no storage for this.

---

## Migration Order

Applies to Postgres only — Sanity has no relational migration concept (schema types are deployed via `sanity schema deploy`, content is created ad hoc by the owner).

1. `users` — no dependencies (Better Auth base table)
2. `sessions`, `verification_tokens` — depend on `users`
3. `addresses` — depend on `users`
4. `orders` — depend on `users`, `addresses`
5. `order_status_history` — depends on `orders`
6. `promo_redemptions` — depend on `users`, `orders`

---

## Indexes & Access Patterns

| Access Pattern                                              | Field(s) to Index                       | Justification                                                        |
| -------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Look up a user by email at OTP login/checkout                    | `users.email` (unique index)                | Equality lookup on every login and every checkout submission                |
| List a user's orders for Order History, newest first              | `orders.userId, orders.createdAt DESC`      | Composite index — filter + sort is the exact Order History query pattern    |
| Fetch a single order for Order Status by ID                       | `orders.id` (PK, already indexed)           | Equality lookup, high selectivity                                           |
| Render an order's status timeline                                 | `order_status_history.orderId`              | Equality lookup, low cardinality per order (≤6 rows)                        |
| Match a Cashfree webhook payload back to an order                 | `orders.cashfreeOrderId` (unique index)     | Equality lookup on every webhook delivery; must be unique to avoid double-processing |
| Enforce a promo code's usage limit                                 | `promo_redemptions.promoCode`               | Count query per checkout attempt with a promo code applied                  |
| List a user's saved addresses                                     | `addresses.userId`                          | Equality lookup, low cardinality per user                                   |

---

## Query Optimisation Notes

- **Partial index candidate:** an index on `orders.status` filtered to `WHERE status NOT IN ('delivered', 'cancelled', 'refunded')` would speed up the owner's "oldest un-updated order" CMS/dashboard view ([PRD.md](./PRD.md) § Key Risks) without indexing the (larger, rarely-queried) terminal-state rows.
- **Covering index:** the Order History composite index (`userId, createdAt DESC`) should include `status` and `total` as included columns so the list view can be served without a heap lookup per row.
- **Denormalisation:** `orders.items` is stored as `jsonb` (a snapshot of product name/price/qty at purchase time) rather than normalized into a line-items table with live FKs to Sanity products — this is intentional, since Sanity product price/name can change after an order is placed and the order must preserve what the customer actually paid for.
- **Pagination:** cursor-based on `orders.createdAt` (with `id` as a tiebreaker) for Order History, since offset pagination degrades as a customer's order count grows and cursor pagination is stable under concurrent inserts.

---

## Seed Data Requirements

| Table                  | Minimum dev/test seed                                                        |
| ------------------------ | -------------------------------------------------------------------------------- |
| Sanity `product`         | 12–15 products across 3+ categories, including at least 2 bundles and 1 out-of-stock item |
| Sanity `category`        | 3–4 categories (e.g. Gifting Edit, Everyday Wear, Bridal, New Arrivals)             |
| Sanity `banner`          | 2 banners (1 active hero, 1 secondary)                                             |
| Sanity `promoCode`       | 2 promo codes — 1 active flat-discount, 1 expired (for error-state testing)         |
| Postgres `users`          | 3 test users — 1 with no past orders (Order History empty state), 1 with several orders across different statuses |
| Postgres `orders`         | ≥6 orders covering every status value (placed, confirmed, shipped, delivered, cancelled, refunded) |
| Postgres `addresses`      | 1–2 addresses per seeded user                                                       |
| Postgres `promo_redemptions` | 1–2 rows tied to a seeded order, to test usage-limit enforcement                |
