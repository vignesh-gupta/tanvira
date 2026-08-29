import { cn } from "@/lib/utils"

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

const STATUS_STYLES: Record<OrderStatus, string> = {
  placed: "bg-muted text-foreground",
  confirmed: "bg-secondary text-secondary-foreground",
  shipped: "bg-primary text-primary-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-primary-foreground",
  refunded: "bg-muted-foreground text-primary-foreground",
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
