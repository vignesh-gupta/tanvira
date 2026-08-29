import { notFound } from "next/navigation"

import { OrderStatusTimeline } from "@/components/storefront/order-status-timeline"
import { StatusBadge } from "@/components/storefront/status-badge"
import { formatRupees } from "@/lib/format"
import { getOrderWithTimeline } from "@/lib/orders"

export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderWithTimeline(id)

  if (!order) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl">Order Status</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mb-8 rounded-lg border border-border p-6">
        <OrderStatusTimeline status={order.status} />
      </div>

      <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
        <p className="mb-2 font-medium">Items</p>
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between text-muted-foreground">
            <span>
              {item.name} × {item.qty}
            </span>
            <span>{formatRupees(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
          <span>Total</span>
          <span>{formatRupees(order.total)}</span>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Questions about your order?{" "}
        <a href="https://wa.me/910000000000" className="text-primary underline">
          Contact us on WhatsApp
        </a>
      </p>
    </div>
  )
}
