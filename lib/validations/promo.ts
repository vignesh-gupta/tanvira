import { z } from "zod"

export const validatePromoSchema = z.object({
  code: z.string().trim().min(1).max(40).toUpperCase(),
  cartTotal: z.number().int().nonnegative(),
})

export type ValidatePromoInput = z.infer<typeof validatePromoSchema>
