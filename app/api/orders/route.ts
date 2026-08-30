import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { and, desc, eq, lt, or } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { addresses, orders } from "@/db/schema"
import { apiError } from "@/lib/api-response"
import { createOrderSchema } from "@/lib/validations/order"
import { validatePromoCode } from "@/lib/promo"
import { createCashfreeOrder, hasActiveHighImpactIncident } from "@/lib/payments/cashfree"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return apiError(401, "unauthorized", "You must be signed in to place an order.")
  }

  if (await hasActiveHighImpactIncident()) {
    return apiError(
      503,
      "payment_incident",
      "Payments are temporarily paused due to a payment gateway incident — please try again shortly.",
    )
  }

  const parsed = createOrderSchema.safeParse(await request.json())
  if (!parsed.success) {
    return apiError(400, "validation_error", parsed.error.issues[0]?.message ?? "Invalid request body.")
  }
  const { items, promoCode, shippingAddress } = parsed.data

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  let discount = 0
  let appliedPromoCode: string | undefined
  if (promoCode) {
    const result = await validatePromoCode(promoCode, subtotal)
    if (!result.valid) {
      return apiError(422, "promo_invalid", result.reason)
    }
    discount = result.discountAmount
    appliedPromoCode = result.code
  }

  const total = Math.max(subtotal - discount, 0)

  // Generated up front (not derived from the DB order id) so the order row
  // can be inserted in one shot with a valid cashfreeOrderId already set —
  // the alternative (create the Cashfree order first) can't build a
  // return_url containing our own order id without a second round trip.
  const cfOrderId = `order_${Date.now()}_${session.user.id.slice(0, 8)}`
  let insertedOrderId: string | undefined

  try {
    const [address] = await db
      .insert(addresses)
      .values({ userId: session.user.id, ...shippingAddress })
      .returning({ id: addresses.id })

    const [order] = await db
      .insert(orders)
      .values({
        userId: session.user.id,
        addressId: address.id,
        items,
        subtotal,
        discount,
        total,
        promoCode: appliedPromoCode,
        cashfreeOrderId: cfOrderId,
      })
      .returning({ id: orders.id })
    insertedOrderId = order.id

    const { paymentSessionId } = await createCashfreeOrder({
      orderId: cfOrderId,
      amountInPaise: total,
      customer: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: shippingAddress.phone,
      },
      returnUrl: `${process.env.BETTER_AUTH_URL}/orders/${order.id}/confirmation?redirected=1`,
      note: `Tanvira order ${order.id}`,
    })

    return NextResponse.json({ orderId: order.id, paymentSessionId, total }, { status: 201 })
  } catch (err) {
    console.error("Order creation failed:", err)
    // If the Cashfree call failed after the order row was already inserted,
    // don't leave an unpayable "placed" order behind.
    if (insertedOrderId) {
      await db.delete(orders).where(eq(orders.id, insertedOrderId))
    }
    return apiError(500, "internal_error", "Couldn't create your order — please try again.")
  }
}

// Cursor pagination on (createdAt desc, id) — see DB_SCHEMA.md § Query Optimisation Notes.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return apiError(401, "unauthorized", "You must be signed in to view order history.")
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 50)
  const cursorParam = searchParams.get("cursor")

  let cursor: { createdAt: Date; id: string } | undefined
  if (cursorParam) {
    try {
      const decoded = JSON.parse(Buffer.from(cursorParam, "base64url").toString("utf8"))
      cursor = { createdAt: new Date(decoded.createdAt), id: decoded.id }
    } catch {
      return apiError(400, "validation_error", "Invalid cursor.")
    }
  }

  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, session.user.id),
        cursor
          ? or(
              lt(orders.createdAt, cursor.createdAt),
              and(eq(orders.createdAt, cursor.createdAt), lt(orders.id, cursor.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = page[page.length - 1]
  const nextCursor =
    hasMore && last
      ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: last.id })).toString(
          "base64url",
        )
      : null

  return NextResponse.json({ orders: page, nextCursor })
}
