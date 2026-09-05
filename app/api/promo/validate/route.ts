import { NextResponse } from "next/server"

import { apiError } from "@/lib/api-response"
import { validatePromoCode } from "@/lib/promo/db"
import { validatePromoSchema } from "@/lib/validations/promo"

export async function POST(request: Request) {
  const parsed = validatePromoSchema.safeParse(await request.json())
  if (!parsed.success) {
    return apiError(400, "validation_error", parsed.error.issues[0]?.message ?? "Invalid request body.")
  }

  const result = await validatePromoCode(parsed.data.code, parsed.data.cartTotal)
  return NextResponse.json(result)
}
