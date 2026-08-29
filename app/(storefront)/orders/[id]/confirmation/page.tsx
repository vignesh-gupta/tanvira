import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatRupees } from "@/lib/format"
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
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      <CheckCircle2 className="mx-auto size-12 text-success" />
      <h1 className="mt-4 font-heading text-2xl">Order confirmed!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We&apos;ve emailed your confirmation. Order ID: <span className="font-mono">{order.id}</span>
      </p>

      <div className="mt-6 space-y-2 rounded-lg border border-border p-4 text-left text-sm">
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between">
            <span className="text-muted-foreground">
              {item.name} × {item.qty}
            </span>
            <span>{formatRupees(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 font-medium">
          <span>Total</span>
          <span>{formatRupees(order.total)}</span>
        </div>
      </div>

      <Button asChild className="mt-6">
        <Link href={`/orders/${order.id}`}>Track your order</Link>
      </Button>
    </div>
  )
}
