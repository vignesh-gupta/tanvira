import { notFound } from "next/navigation"

import { OrderConfirmation } from "@/components/storefront/order-confirmation"
import { getOrderWithTimeline } from "@/lib/orders/db"
import { getCashfreeOrder } from "@/lib/payments/cashfree"

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ redirected?: string }>
}) {
  const { id } = await params
  const { redirected } = await searchParams
  const order = await getOrderWithTimeline(id)

  if (!order) notFound()

  // Cashfree's return_url only tells us the customer is back — not the
  // outcome. This is a single read-only status check (never a DB write;
  // only the webhook advances orders.status), so it does not reintroduce
  // polling — it just makes the one redirect we do get more informative
  // while the webhook is still in flight.
  let liveHint: "PAID" | "ACTIVE" | "EXPIRED" | "TERMINATED" | undefined
  if (redirected === "1" && order.status === "placed") {
    const live = await getCashfreeOrder(order.cashfreeOrderId)
    liveHint = live?.orderStatus
  }

  return (
    <OrderConfirmation
      orderId={order.id}
      orderNumber={order.orderSeq}
      initialStatus={order.status}
      liveHint={liveHint}
      items={order.items}
      total={order.total}
    />
  )
}
