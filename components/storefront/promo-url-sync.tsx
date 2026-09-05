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

  // `subtotal` and `applyPromo` change on every render this effect doesn't
  // actually care about (cart contents, mutation object identity) — reading
  // them via a ref keeps the effect's own dependency list to just the values
  // that should re-trigger it, instead of suppressing the lint rule. Effects
  // run in declaration order, so this stays fresh before the effect below
  // reads it (writing to a ref during render itself isn't allowed).
  const latest = useRef({ subtotal, applyPromo, setPromo })
  useEffect(() => {
    latest.current = { subtotal, applyPromo, setPromo }
  })

  useEffect(() => {
    if (!promoParam || applied || attempted.current === promoParam) return
    attempted.current = promoParam

    const { subtotal, applyPromo, setPromo } = latest.current
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
  }, [promoParam, applied])

  return null
}
