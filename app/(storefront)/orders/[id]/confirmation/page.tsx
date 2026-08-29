import { notFound } from "next/navigation"

import { OrderConfirmation } from "@/components/storefront/order-confirmation"
import { getOrderWithTimeline } from "@/lib/orders"

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderWithTimeline(id)

  if (!order) notFound()

  return (
    <OrderConfirmation
      orderId={order.id}
      initialStatus={order.status}
      items={order.items}
      total={order.total}
    />
  )
}
