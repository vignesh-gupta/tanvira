import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { orderStatusHistory, orders } from "@/db/schema"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// `id` is either the raw UUID (`orders.id`, used internally and by the
// payment-confirmation link) or the human-facing `TVA<seq>` number (used by
// account order-history) — every "view this order" link can point at the
// same route and this resolves whichever format it's carrying.
export async function getOrderWithTimeline(id: string) {
  let condition
  if (UUID_RE.test(id)) {
    condition = eq(orders.id, id)
  } else {
    const orderSeq = Number(id.replace(/^TVA/i, ""))
    if (Number.isNaN(orderSeq)) return null
    condition = eq(orders.orderSeq, orderSeq)
  }

  const [order] = await db.select().from(orders).where(condition)
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
