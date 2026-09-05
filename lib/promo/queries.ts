import { useMutation, useQuery } from "@tanstack/react-query"

export interface PromoValidationResult {
  valid: boolean
  code?: string
  discountAmount?: number
  reason?: string
}

async function validatePromoCode(code: string, cartTotal: number): Promise<PromoValidationResult> {
  const res = await fetch("/api/promo/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, cartTotal }),
  })
  return res.json()
}

export const promoKeys = {
  validate: (code: string, cartTotal: number) => ["promo", "validate", code, cartTotal] as const,
}

// An already-applied promo (persisted across pages, or auto-applied from a
// `?promo=` link before anything was in the cart) was validated against
// whatever the subtotal was at that moment — this re-runs whenever the
// subtotal changes so the discount amount (and continued validity) stays
// correct instead of going stale.
export function usePromoRevalidation(code: string | undefined, cartTotal: number) {
  return useQuery({
    queryKey: promoKeys.validate(code ?? "", cartTotal),
    queryFn: () => validatePromoCode(code as string, cartTotal),
    enabled: !!code,
  })
}

// One-shot apply — used by the manual "Apply" button and the `?promo=` URL
// sync, both of which need explicit success/error handling rather than a
// query's cached-and-refetched result.
export function useApplyPromoMutation() {
  return useMutation({
    mutationFn: ({ code, cartTotal }: { code: string; cartTotal: number }) =>
      validatePromoCode(code, cartTotal),
  })
}
