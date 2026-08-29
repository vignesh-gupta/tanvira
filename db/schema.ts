import {
  pgTable,
  pgEnum,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import * as authSchema from "./auth-schema"

export const {
  user,
  account,
  accountRelations,
  session,
  sessionRelations,
  userRelations,
  verification,
} = authSchema

/**
 * ─────────────────────────────────────────────────────────────
 * APP TABLES (transactional data — orders, addresses, promos)
 * ─────────────────────────────────────────────────────────────
 */

export type OrderItem = {
  productId: string
  name: string
  price: number // paise, snapshotted at order time
  qty: number
}

export const orderStatusEnum = pgEnum("order_status", [
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
])

export const discountTypeEnum = pgEnum("discount_type", ["flat", "percent"])

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  // Plain delivery-contact field — not used for authentication in v1.
  phone: text("phone").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

/**
 * Order line items are stored as jsonb rather than a separate line-items
 * table — order volume is low for a small business and items are
 * immutable once placed (a snapshot of name/price at purchase time,
 * so later Sanity price edits never retroactively change a past order).
 * Shape: { productId: string, name: string, price: number, qty: number }[]
 */
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  addressId: uuid("address_id")
    .notNull()
    .references(() => addresses.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").notNull().default("placed"),
  items: jsonb("items").notNull().$type<OrderItem[]>(),
  subtotal: integer("subtotal").notNull(), // paise
  discount: integer("discount").notNull().default(0), // paise
  total: integer("total").notNull(), // paise
  promoCode: text("promo_code"),
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Powers the order status timeline UI — one row per status change.
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    changedAt: timestamp("changed_at").notNull().defaultNow(),
    note: text("note"), // optional, e.g. "Shipped via BlueDart, AWB 1234"
  },
  (table) => [
    // An order passes through a given status once — also what makes the
    // seed script's history insert idempotent against re-runs.
    uniqueIndex("order_status_history_order_id_status_uidx").on(table.orderId, table.status),
  ],
)

/**
 * Promo code *definitions* (code, discount type/value, validity window)
 * live in Sanity, editable by the owner. This table only tracks
 * *redemptions* — data that must be transactional consistent to
 * enforce usage limits, which Sanity isn't built for.
 */
export const promoRedemptions = pgTable(
  "promo_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promoCode: text("promo_code").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
  },
  (table) => [
    // An order redeems at most one promo code — also what makes the
    // webhook's redemption insert idempotent against retries.
    uniqueIndex("promo_redemptions_order_id_uidx").on(table.orderId),
  ],
)
