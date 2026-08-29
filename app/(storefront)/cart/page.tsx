"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ShoppingBag } from "lucide-react"

import { CartLineItemRow } from "@/components/storefront/cart-line-item"
import { PromoCodeInput, type AppliedPromo } from "@/components/storefront/promo-code-input"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart/cart-context"
import { formatRupees } from "@/lib/format"

export default function CartPage() {
  const { items, subtotal } = useCart()
  const [promo, setPromo] = useState<AppliedPromo | null>(null)
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" />
        <p className="text-lg text-foreground">Your cart is empty</p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    )
  }

  const discount = promo?.discountAmount ?? 0
  const total = Math.max(subtotal - discount, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl">Your Cart</h1>

      <div className="grid gap-8 sm:grid-cols-3">
        <div className="sm:col-span-2">
          {items.map((item) => (
            <CartLineItemRow key={item.productId} item={item} />
          ))}
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4 sm:col-span-1">
          <PromoCodeInput cartTotal={subtotal} onApplied={setPromo} />

          <div className="space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatRupees(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatRupees(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-medium text-foreground">
              <span>Total</span>
              <span>{formatRupees(total)}</span>
            </div>
          </div>

          <Button className="w-full" onClick={() => router.push("/checkout")}>
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
