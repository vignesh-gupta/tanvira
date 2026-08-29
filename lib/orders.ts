import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { orderStatusHistory, orders } from "@/db/schema"

export async function getOrderWithTimeline(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) return null

  const timeline = await db
    .select({ status: orderStatusHistory.status, changedAt: orderStatusHistory.changedAt })
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, id))
    .orderBy(asc(orderStatusHistory.changedAt))

  return { ...order, timeline }
}
