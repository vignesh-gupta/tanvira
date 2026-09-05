import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { orderStatusHistory, orders } from "@/db/schema"

export async function getOrderWithTimeline(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) return null

  const timeline = await db
    .select({
      status: orderStatusHistory.status,
      changedAt: orderStatusHistory.changedAt,
    })
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, id))
    .orderBy(asc(orderStatusHistory.changedAt))

  return { ...order, timeline }
}

export async function getOrderWithTimelineWithOrderSeq(orderId: string) {
  const orderSeq = Number(orderId.slice(3)) // Assuming the order ID is in the format "ORD12345", this extracts the numeric part and converts it to a number.

  if (isNaN(orderSeq)) {
    return null // Return null if the orderSeq is not a valid number
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderSeq, orderSeq))
  if (!order) return null

  const timeline = await db
    .select({
      status: orderStatusHistory.status,
      changedAt: orderStatusHistory.changedAt,
    })
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, order.id))
    .orderBy(asc(orderStatusHistory.changedAt))

  return { ...order, timeline }
}
