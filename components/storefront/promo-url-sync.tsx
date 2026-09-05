"use client"

import { useEffect, useRef } from "react"
import { useQueryState } from "nuqs"

import { usePromoStore } from "@/lib/promo/promo-store"
import { useCart } from "@/lib/cart/cart-context"

// Mounted once at the app root (inside CartProvider) so a `?promo=CODE` link
// (e.g. a future ad campaign) auto-applies regardless of which storefront
// page it lands on — same validate-and-apply call as PromoCodeInput's
// manual "Apply" button, against whatever the cart's current subtotal is.
export function PromoUrlSync() {
  const [promoParam] = useQueryState("promo")
  const applied = usePromoStore((s) => s.promo)
  const setPromo = usePromoStore((s) => s.setPromo)
  const { subtotal } = useCart()
  const attempted = useRef<string | null>(null)

  useEffect(() => {
    if (!promoParam || applied || attempted.current === promoParam) return
    attempted.current = promoParam

    fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoParam, cartTotal: subtotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setPromo({ code: data.code, discountAmount: data.discountAmount })
        }
      })
      .catch(() => {})
  }, [promoParam, applied, setPromo])

  return null
}
