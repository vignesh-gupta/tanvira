import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { orderStatusHistory, orders, promoRedemptions, user } from "@/db/schema"
import { apiError } from "@/lib/api-response"
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay"
import { EMAIL_FROM, resend } from "@/lib/email/resend"
import { OrderConfirmationEmail } from "@/lib/email/templates/order-confirmation-email"

interface RazorpayPaymentEntity {
  id: string
  order_id: string
}

interface RazorpayWebhookPayload {
  event: string
  payload: { payment: { entity: RazorpayPaymentEntity } }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-razorpay-signature")

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return apiError(400, "webhook_signature_invalid", "Signature verification failed.")
  }

  const body = JSON.parse(rawBody) as RazorpayWebhookPayload

  if (body.event === "payment.captured") {
    const { id: paymentId, order_id: razorpayOrderId } = body.payload.payment.entity

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, razorpayOrderId))
    if (!order) {
      // Unknown order — ack anyway so Razorpay doesn't retry indefinitely.
      return NextResponse.json({ received: true })
    }

    // Idempotent: a webhook retry must not double-confirm or double-redeem.
    if (order.status === "placed") {
      await db
        .update(orders)
        .set({ status: "confirmed", razorpayPaymentId: paymentId, updatedAt: new Date() })
        .where(eq(orders.id, order.id))

      await db.insert(orderStatusHistory).values({ orderId: order.id, status: "confirmed" })

      if (order.promoCode) {
        await db
          .insert(promoRedemptions)
          .values({ promoCode: order.promoCode, userId: order.userId, orderId: order.id })
          .onConflictDoNothing({ target: promoRedemptions.orderId })
      }

      const [customer] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, order.userId))

      if (customer) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: customer.email,
          subject: "Your Tanvira order is confirmed",
          react: OrderConfirmationEmail({
            orderId: order.id,
            items: order.items,
            total: order.total,
          }),
        })
      }
    }
  }

  // payment.failed: the order stays "placed" so checkout can retry with the
  // same cart — see DESIGN.md § Checkout States.

  return NextResponse.json({ received: true })
}
