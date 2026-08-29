import crypto from "node:crypto"

import Razorpay from "razorpay"

// Constructed lazily — the Razorpay SDK throws synchronously when key_id is
// missing, and this module is imported at the top of app/api/orders/route.ts.
// An eager instantiation would take down the entire orders endpoint
// (including plain GET/order-history reads) whenever Razorpay keys aren't
// configured yet, not just order creation.
let client: Razorpay | undefined

function getRazorpayClient() {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }
  return client
}

/** Amount must be an integer number of paise (INR's smallest unit). */
export async function createRazorpayOrder(amountInPaise: number, receipt: string) {
  return getRazorpayClient().orders.create({
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
