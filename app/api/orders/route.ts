import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { and, desc, eq, lt, or } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { addresses, orders } from "@/db/schema"
import { apiError } from "@/lib/api-response"
import { createOrderSchema } from "@/lib/validations/order"
import { validatePromoCode } from "@/lib/promo"
import { createRazorpayOrder } from "@/lib/payments/razorpay"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return apiError(401, "unauthorized", "You must be signed in to place an order.")
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

  const [address] = await db
    .insert(addresses)
    .values({ userId: session.user.id, ...shippingAddress })
    .returning({ id: addresses.id })

  const receipt = `order_${Date.now()}`
  const razorpayOrder = await createRazorpayOrder(total, receipt)

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
      razorpayOrderId: razorpayOrder.id,
    })
    .returning({ id: orders.id })

  return NextResponse.json(
    { orderId: order.id, razorpayOrderId: razorpayOrder.id, total },
    { status: 201 },
  )
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
