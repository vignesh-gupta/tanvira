"use client"

import Image from "next/image"
import { Minus, Plus, X } from "lucide-react"

import { type CartItem, useCart } from "@/lib/cart/cart-context"
import { formatRupees } from "@/lib/format"

export function CartLineItemRow({ item }: { item: CartItem }) {
  const { updateQty, removeItem } = useCart()

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 text-sm break-words text-foreground">{item.name}</p>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remove ${item.name} from cart`}
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
            <button
              type="button"
              onClick={() => updateQty(item.productId, item.qty - 1)}
              aria-label="Decrease quantity"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-4 text-center text-sm">{item.qty}</span>
            <button
              type="button"
              onClick={() => updateQty(item.productId, item.qty + 1)}
              aria-label="Increase quantity"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <p className="text-sm font-medium text-primary">
            {formatRupees(item.price * item.qty)}
          </p>
        </div>
      </div>
    </div>
  )
}
