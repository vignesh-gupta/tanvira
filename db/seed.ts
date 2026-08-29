/**
 * Postgres seed data — see DB_SCHEMA.md § Seed Data Requirements.
 * Safely re-runnable: every insert is keyed by a fixed id and uses
 * onConflictDoNothing/onConflictDoUpdate, per the phase's idempotency rule.
 *
 * Sanity content (products/categories/banners/promo codes) is seeded
 * separately in sanity/seed.ts, which needs a SANITY_API_TOKEN this repo
 * doesn't have configured — run that once a write token is available.
 */
import { db } from "./index"
import { addresses, orderStatusHistory, orders, promoRedemptions, user } from "./schema"

// user.id is Better Auth's text type, so readable ids work directly.
// addresses.id / orders.id are uuid columns — fixed literal UUIDs instead.
const SEED_USERS = [
  { id: "seed-user-ananya", name: "Ananya Sharma", email: "ananya.seed@example.com" },
  { id: "seed-user-rohan", name: "Rohan Verma", email: "rohan.seed@example.com" }, // no orders — Order History empty state
  { id: "seed-user-priya", name: "Priya Iyer", email: "priya.seed@example.com" },
] as const

const ADDRESS_ID_BY_USER: Record<string, string> = {
  "seed-user-ananya": "10000000-0000-4000-8000-000000000001",
  "seed-user-rohan": "10000000-0000-4000-8000-000000000002",
  "seed-user-priya": "10000000-0000-4000-8000-000000000003",
}

const SEED_ADDRESS = {
  line1: "221B Baker Street",
  line2: "Near City Mall",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  phone: "9876543210",
}

type OrderStatus =
  | "placed"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

// One order per status value, so every Status Badge / timeline state has a
// real example to view in Order History and Order Status.
const SEED_ORDERS: { id: string; userId: string; status: OrderStatus; promoCode?: string }[] = [
  { id: "20000000-0000-4000-8000-000000000001", userId: "seed-user-ananya", status: "placed" },
  { id: "20000000-0000-4000-8000-000000000002", userId: "seed-user-ananya", status: "confirmed" },
  { id: "20000000-0000-4000-8000-000000000003", userId: "seed-user-ananya", status: "shipped" },
  {
    id: "20000000-0000-4000-8000-000000000004",
    userId: "seed-user-ananya",
    status: "delivered",
    promoCode: "WELCOME10",
  },
  { id: "20000000-0000-4000-8000-000000000005", userId: "seed-user-priya", status: "cancelled" },
  { id: "20000000-0000-4000-8000-000000000006", userId: "seed-user-priya", status: "refunded" },
]

// Progressive history — a "delivered" order passed through every prior
// status, a "placed" order has only reached its first one.
const STATUS_SEQUENCE: OrderStatus[] = ["placed", "confirmed", "shipped", "delivered"]

const SAMPLE_ITEMS = [
  { productId: "seed-product-gold-ring", name: "Gold Ring", price: 19900, qty: 1 },
  { productId: "seed-product-pearl-earrings", name: "Luna Pearl Drop Earrings", price: 34900, qty: 2 },
]

async function seed() {
  console.log("Seeding users...")
  for (const u of SEED_USERS) {
    await db
      .insert(user)
      .values({ id: u.id, name: u.name, email: u.email, emailVerified: true })
      .onConflictDoUpdate({ target: user.id, set: { name: u.name, email: u.email } })
  }

  console.log("Seeding addresses...")
  for (const u of SEED_USERS) {
    const id = ADDRESS_ID_BY_USER[u.id]
    await db
      .insert(addresses)
      .values({ id, userId: u.id, isDefault: true, ...SEED_ADDRESS })
      .onConflictDoUpdate({ target: addresses.id, set: SEED_ADDRESS })
  }

  console.log("Seeding orders + status history + promo redemptions...")
  for (const o of SEED_ORDERS) {
    const items = SAMPLE_ITEMS
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const discount = o.promoCode ? Math.round(subtotal * 0.1) : 0
    const total = subtotal - discount

    await db
      .insert(orders)
      .values({
        id: o.id,
        userId: o.userId,
        addressId: ADDRESS_ID_BY_USER[o.userId],
        status: o.status,
        items,
        subtotal,
        discount,
        total,
        promoCode: o.promoCode,
        razorpayOrderId: `seed_rzp_${o.id}`,
        razorpayPaymentId: o.status === "placed" ? null : `seed_pay_${o.id}`,
      })
      .onConflictDoUpdate({
        target: orders.id,
        set: { status: o.status, updatedAt: new Date() },
      })

    // Terminal states (cancelled/refunded) only ever reach "placed" first;
    // the happy path accumulates history up to its current step.
    const history: OrderStatus[] =
      o.status === "cancelled" || o.status === "refunded"
        ? ["placed", o.status]
        : STATUS_SEQUENCE.slice(0, STATUS_SEQUENCE.indexOf(o.status) + 1)

    for (const status of history) {
      await db
        .insert(orderStatusHistory)
        .values({ orderId: o.id, status })
        .onConflictDoNothing({
          target: [orderStatusHistory.orderId, orderStatusHistory.status],
        })
    }

    if (o.promoCode) {
      await db
        .insert(promoRedemptions)
        .values({ promoCode: o.promoCode, userId: o.userId, orderId: o.id })
        .onConflictDoNothing({ target: promoRedemptions.orderId })
    }
  }

  console.log("Done. Seeded:")
  console.log(`  ${SEED_USERS.length} users (1 with no orders, for the empty-state check)`)
  console.log(`  ${SEED_ORDERS.length} orders covering every order_status value`)
  console.log(`  1 promo redemption (WELCOME10)`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
