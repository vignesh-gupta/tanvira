import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { orderStatusHistory, orders } from "@/db/schema"
import { apiError } from "@/lib/api-response"
import { shipOrderSchema } from "@/lib/validations/order"

// Ships from two callers: the in-app /admin/orders dashboard (an
// authenticated session with role "admin") and the legacy Sanity Studio
// "Ship Order" tool (sanity/tools/ship-order-tool.tsx), which has no
// session and is gated by a server-only shared secret instead.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers })
  const isAdmin = session?.user.role === "admin"

  if (!isAdmin) {
    const secret = request.headers.get("x-admin-secret")
    if (!secret || secret !== process.env.ADMIN_API_SECRET) {
      return apiError(401, "unauthorized", "Missing or invalid admin secret.")
    }
  }

  const parsed = shipOrderSchema.safeParse(await request.json())
  if (!parsed.success) {
    return apiError(
      400,
      "validation_error",
      parsed.error.issues[0]?.message ?? "A valid trackingUrl is required to ship an order.",
    )
  }
  const { trackingUrl } = parsed.data

  const { id } = await params
  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) {
    return apiError(404, "not_found", "No order found with that ID.")
  }

  // Only a confirmed order can be shipped — also keeps this idempotent
  // against a retried request (order_status_history has one row per status).
  if (order.status !== "confirmed") {
    return apiError(
      409,
      "invalid_status_transition",
      `Order must be "confirmed" to ship — it is currently "${order.status}".`,
    )
  }

  await db
    .update(orders)
    .set({ status: "shipped", trackingUrl, updatedAt: new Date() })
    .where(eq(orders.id, order.id))

  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    status: "shipped",
    note: `Tracking: ${trackingUrl}`,
  })

  return NextResponse.json({ id: order.id, status: "shipped", trackingUrl })
}
