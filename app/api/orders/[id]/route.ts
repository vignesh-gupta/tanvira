import { NextResponse } from "next/server"

import { apiError } from "@/lib/api-response"
import { getOrderWithTimeline } from "@/lib/orders"

// No session required — an order is reachable via its shareable link
// (see API_SPEC.md § Orders). Only Order History (GET /api/orders) is
// session-gated to the order's owner.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await getOrderWithTimeline(id)
  if (!order) {
    return apiError(404, "not_found", "No order found with that ID.")
  }

  return NextResponse.json(order)
}
