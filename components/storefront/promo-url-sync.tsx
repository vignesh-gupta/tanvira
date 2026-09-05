"use client"

import { useEffect, useRef } from "react"
import { useQueryState } from "nuqs"

import { usePromoStore } from "@/lib/promo/promo-store"
import { useCart } from "@/lib/cart/cart-context"
import { useApplyPromoMutation } from "@/lib/promo/queries"

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
  const applyPromo = useApplyPromoMutation()

  useEffect(() => {
    if (!promoParam || applied || attempted.current === promoParam) return
    attempted.current = promoParam

    applyPromo.mutate(
      { code: promoParam, cartTotal: subtotal },
      {
        onSuccess: (data) => {
          if (data.valid) {
            setPromo({ code: data.code!, discountAmount: data.discountAmount! })
          }
        },
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoParam, applied, setPromo])

  return null
}
