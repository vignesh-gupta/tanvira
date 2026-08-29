import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/components/storefront/status-badge"

const HAPPY_PATH: OrderStatus[] = ["placed", "confirmed", "shipped", "delivered"]
const TERMINAL_LABELS: Partial<Record<OrderStatus, string>> = {
  cancelled: "Cancelled",
  refunded: "Refunded",
}

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <p className="text-sm font-medium text-destructive" role="status">
        This order was {TERMINAL_LABELS[status]?.toLowerCase()}.
      </p>
    )
  }

  const currentIndex = HAPPY_PATH.indexOf(status)

  return (
    <ol className="flex items-center" aria-label="Order status">
      {HAPPY_PATH.map((step, i) => {
        const done = i <= currentIndex
        const isLast = i === HAPPY_PATH.length - 1

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors duration-200",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
                aria-current={i === currentIndex ? "step" : undefined}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] capitalize",
                  done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-colors duration-200",
                  i < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
