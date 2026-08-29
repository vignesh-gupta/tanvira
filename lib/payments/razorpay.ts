import crypto from "node:crypto"

import Razorpay from "razorpay"

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

/** Amount must be an integer number of paise (INR's smallest unit). */
export async function createRazorpayOrder(amountInPaise: number, receipt: string) {
  return razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt,
  })
}

/**
 * Verifies the `X-Razorpay-Signature` header against the raw request body
 * using RAZORPAY_WEBHOOK_SECRET. An order's status must never advance on a
 * webhook payload that fails this check (see ARCHITECTURE.md § Security Model).
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex")

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
