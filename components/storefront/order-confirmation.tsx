"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import type { OrderStatus } from "@/components/storefront/status-badge"
import { Button } from "@/components/ui/button"
import type { OrderItem } from "@/db/schema"
import { useCart } from "@/lib/cart/cart-context"
import { usePromoStore } from "@/lib/promo/promo-store"
import { formatOrderNumber, formatRupees } from "@/lib/format"

type LiveHint = "PAID" | "ACTIVE" | "EXPIRED" | "TERMINATED" | undefined

export function OrderConfirmation({
  orderId,
  orderNumber,
  initialStatus,
  liveHint,
  items,
  total,
}: {
  orderId: string
  orderNumber: number
  initialStatus: OrderStatus
  liveHint?: LiveHint
  items: OrderItem[]
  total: number
}) {
  const { clear } = useCart()
  const clearPromo = usePromoStore((s) => s.clear)

  const confirmed = initialStatus !== "placed"
  const paymentReceived = confirmed || liveHint === "PAID"
  const paymentFailed = !confirmed && (liveHint === "EXPIRED" || liveHint === "TERMINATED")
  const stillConfirming = !confirmed && !paymentFailed

  // Cart clearing used to happen in the Razorpay checkout `handler` callback;
  // now that the browser round-trips through Cashfree's hosted page, it's
  // done here instead, once we can see payment actually went through.
  useEffect(() => {
    if (paymentReceived) {
      clear()
      clearPromo()
    }
  }, [paymentReceived, clear, clearPromo])

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      {paymentFailed ? (
        <>
          <XCircle className="mx-auto size-12 text-destructive" />
          <h1 className="mt-4 font-heading text-2xl">Payment didn&apos;t go through</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your order wasn&apos;t charged. You can try again from your cart.
          </p>
        </>
      ) : stillConfirming ? (
        <>
          <Loader2 className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl">Still confirming</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is taking longer than usual. We&apos;ll email you the moment it&apos;s confirmed —
            you can also refresh this page or check back on your order status page.
          </p>
        </>
      ) : (
        <>
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-4 font-heading text-2xl">
            {confirmed ? "Order confirmed!" : "Payment received!"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {confirmed
              ? "We've emailed your confirmation."
              : "We're finalizing your order — you'll get an email shortly."}{" "}
            Order ID: <span className="font-mono">{formatOrderNumber(orderNumber)}</span>
          </p>
        </>
      )}

      <div className="mt-6 space-y-2 rounded-lg border border-border p-4 text-left text-sm">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between">
            <span className="text-muted-foreground">
              {item.name} × {item.qty}
            </span>
            <span>{formatRupees(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 font-medium">
          <span>Total</span>
          <span>{formatRupees(total)}</span>
        </div>
      </div>

      {paymentFailed ? (
        <Button asChild className="mt-6">
          <Link href="/checkout">Retry payment</Link>
        </Button>
      ) : confirmed ? (
        <Button asChild className="mt-6">
          <Link href={`/orders/${orderId}`}>Track your order</Link>
        </Button>
      ) : null}
    </div>
  )
}
