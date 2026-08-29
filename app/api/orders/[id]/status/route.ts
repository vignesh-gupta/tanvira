import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { orders } from "@/db/schema"
import { apiError } from "@/lib/api-response"

// Polled by the checkout confirmation page while the Razorpay webhook is
// still in flight — keep this query minimal (status only, no items/address).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return apiError(401, "unauthorized", "You must be signed in to check order status.")
  }

  const { id } = await params
  const [order] = await db
    .select({ status: orders.status, userId: orders.userId })
    .from(orders)
    .where(eq(orders.id, id))

  if (!order || order.userId !== session.user.id) {
    return apiError(404, "not_found", "Order not found.")
  }

  return NextResponse.json({ status: order.status })
}
