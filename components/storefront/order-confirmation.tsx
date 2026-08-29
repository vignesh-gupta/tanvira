"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2 } from "lucide-react"

import type { OrderStatus } from "@/components/storefront/status-badge"
import { Button } from "@/components/ui/button"
import type { OrderItem } from "@/db/schema"
import { formatRupees } from "@/lib/format"

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 30 // ~60s — Razorpay webhooks land in a couple of seconds in practice

// Short polling: simplest option that works unchanged on serverless/edge
// hosting (no long-lived connection to keep alive, unlike long-polling or
// SSE), and confirmation only needs to happen once per checkout.
function usePolledOrderStatus(orderId: string, initialStatus: OrderStatus) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (status !== "placed") return

    let cancelled = false
    let attempts = 0
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      attempts += 1
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" })
        if (res.ok) {
          const data = (await res.json()) as { status: OrderStatus }
          if (!cancelled && data.status !== "placed") {
            setStatus(data.status)
            return
          }
        }
      } catch {
        // network hiccup — just retry on the next tick
      }
      if (cancelled) return
      if (attempts >= MAX_POLLS) {
        setTimedOut(true)
        return
      }
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
    }

    timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [orderId, status])

  return { status, timedOut }
}

export function OrderConfirmation({
  orderId,
  initialStatus,
  items,
  total,
}: {
  orderId: string
  initialStatus: OrderStatus
  items: OrderItem[]
  total: number
}) {
  const { status, timedOut } = usePolledOrderStatus(orderId, initialStatus)
  const isPending = status === "placed" && !timedOut

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      {isPending ? (
        <>
          <Loader2 className="mx-auto size-12 animate-spin text-primary" />
          <h1 className="mt-4 font-heading text-2xl">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This usually takes just a few seconds — don&apos;t close this page.
          </p>
        </>
      ) : timedOut ? (
        <>
          <Loader2 className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl">Still confirming</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is taking longer than usual. We&apos;ll email you the moment it&apos;s confirmed —
            you can also check back on your order status page.
          </p>
        </>
      ) : (
        <>
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-4 font-heading text-2xl">Order confirmed!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve emailed your confirmation. Order ID: <span className="font-mono">{orderId}</span>
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

      {!isPending ? (
        <Button asChild className="mt-6">
          <Link href={`/orders/${orderId}`}>Track your order</Link>
        </Button>
      ) : null}
    </div>
  )
}
