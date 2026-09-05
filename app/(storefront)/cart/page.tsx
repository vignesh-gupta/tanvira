"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingBag } from "lucide-react"

import { CartLineItemRow } from "@/components/storefront/cart-line-item"
import { PromoCodeInput } from "@/components/storefront/promo-code-input"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart/cart-context"
import { usePromoStore } from "@/lib/promo/promo-store"
import { formatRupees } from "@/lib/format"

export default function CartPage() {
  const { items, subtotal } = useCart()
  const promo = usePromoStore((s) => s.promo)
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
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-4 font-heading text-xl sm:mb-6 sm:text-2xl">Your Cart</h1>

      <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
        <div className="sm:col-span-2">
          {items.map((item) => (
            <CartLineItemRow key={item.productId} item={item} />
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border p-4 sm:col-span-1">
          <PromoCodeInput cartTotal={subtotal} />

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
