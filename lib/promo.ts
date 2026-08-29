import { count, eq } from "drizzle-orm"

import { db } from "@/db"
import { promoRedemptions } from "@/db/schema"
import { client } from "@/sanity/lib/client"
import { PROMO_CODE_QUERY } from "@/lib/sanity/queries"

export type PromoValidationResult =
  | {
      valid: true
      code: string
      discountType: "flat" | "percent"
      value: number
      discountAmount: number // paise
    }
  | { valid: false; reason: string }

/**
 * Re-validated server-side on every checkout attempt, never trusted from the
 * client — see API_SPEC.md § Promo Codes and DESIGN.md's invalid-code states.
 */
export async function validatePromoCode(
  code: string,
  cartTotalPaise: number,
): Promise<PromoValidationResult> {
  const promo = await client.fetch(PROMO_CODE_QUERY, { code })

  if (!promo || !promo.isActive) {
    return { valid: false, reason: "This promo code doesn't exist or is inactive." }
  }

  const now = new Date()
  if (promo.validFrom && now < new Date(promo.validFrom)) {
    return { valid: false, reason: "This promo code isn't active yet." }
  }
  if (promo.validTo && now > new Date(promo.validTo)) {
    return { valid: false, reason: "This promo code has expired." }
  }

  if (promo.usageLimit != null) {
    const [{ redeemed }] = await db
      .select({ redeemed: count() })
      .from(promoRedemptions)
      .where(eq(promoRedemptions.promoCode, promo.code))

    if (redeemed >= promo.usageLimit) {
      return { valid: false, reason: "This promo code has reached its usage limit." }
    }
  }

  const discountAmount =
    promo.discountType === "flat"
      ? Math.min(promo.value * 100, cartTotalPaise) // Sanity stores flat value in rupees
      : Math.round((cartTotalPaise * promo.value) / 100)

  return {
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    value: promo.value,
    discountAmount,
  }
}
