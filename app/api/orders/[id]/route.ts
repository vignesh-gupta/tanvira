import { NextResponse } from "next/server"
import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { orderStatusHistory, orders } from "@/db/schema"
import { apiError } from "@/lib/api-response"

// No session required — an order is reachable via its shareable link
// (see API_SPEC.md § Orders). Only Order History (GET /api/orders) is
// session-gated to the order's owner.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) {
    return apiError(404, "not_found", "No order found with that ID.")
  }

  const timeline = await db
    .select({ status: orderStatusHistory.status, changedAt: orderStatusHistory.changedAt })
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, id))
    .orderBy(asc(orderStatusHistory.changedAt))

  return NextResponse.json({
    id: order.id,
    status: order.status,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    createdAt: order.createdAt,
    timeline,
  })
}
