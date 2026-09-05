"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge, type OrderStatus } from "@/components/storefront/status-badge"
import { formatDate, formatOrderNumber, formatRupees } from "@/lib/format"
import { useShipOrder } from "@/lib/orders/queries"

type OrderRow = {
  id: string
  orderSeq: number
  status: OrderStatus
  total: number
  trackingUrl: string | null
  createdAt: Date
  customerName: string
  customerEmail: string
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter()
  const [shippingOrder, setShippingOrder] = useState<OrderRow | null>(null)

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{formatOrderNumber(order.orderSeq)}</TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell className="text-sm">{formatRupees(order.total)}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right">
                  {order.status === "confirmed" ? (
                    <Button size="sm" onClick={() => setShippingOrder(order)}>
                      Ship
                    </Button>
                  ) : order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline underline-offset-4"
                    >
                      Tracking link
                    </a>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ShipOrderDialog
        order={shippingOrder}
        onOpenChange={(open) => !open && setShippingOrder(null)}
        onShipped={() => {
          setShippingOrder(null)
          router.refresh()
        }}
      />
    </>
  )
}

function ShipOrderDialog({
  order,
  onOpenChange,
  onShipped,
}: {
  order: OrderRow | null
  onOpenChange: (open: boolean) => void
  onShipped: () => void
}) {
  const [trackingUrl, setTrackingUrl] = useState("")
  const shipOrder = useShipOrder()

  function handleSubmit() {
    if (!order) return
    shipOrder.mutate(
      { orderId: order.id, trackingUrl: trackingUrl.trim() },
      {
        onSuccess: () => {
          toast.success(`Order ${formatOrderNumber(order.orderSeq)} marked as shipped.`)
          setTrackingUrl("")
          onShipped()
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ship order {order ? formatOrderNumber(order.orderSeq) : ""}</DialogTitle>
          <DialogDescription>
            A tracking URL is required — it&apos;s shown to the customer on their order status
            page.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="url"
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="https://track.example.com/AWB1234"
          autoFocus
        />

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={shipOrder.isPending || trackingUrl.trim().length === 0}
          >
            {shipOrder.isPending ? "Shipping…" : "Mark as shipped"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
