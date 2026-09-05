import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { orderStatusHistory, orders, promoRedemptions, user } from "@/db/schema"
import { apiError } from "@/lib/api-response"
import { formatRupees } from "@/lib/format"
import { verifyCashfreeWebhookSignature } from "@/lib/payments/cashfree"
import { EMAIL_FROM, resend } from "@/lib/email/resend"
import { OrderConfirmationEmail } from "@/lib/email/templates/order-confirmation-email"

interface CashfreeWebhookPayload {
  type: string
  data: {
    order: { order_id: string }
    payment?: { cf_payment_id: string }
    refund?: {
      cf_refund_id: string
      refund_id: string
      refund_amount: number
      refund_status: string
    }
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const timestamp = request.headers.get("x-webhook-timestamp")
  const signature = request.headers.get("x-webhook-signature")

  if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    return apiError(
      400,
      "webhook_signature_invalid",
      "Signature verification failed."
    )
  }

  const body = JSON.parse(rawBody) as CashfreeWebhookPayload

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((body.data as any).test_object) {
    // This is test call
    return NextResponse.json({ received: true })
  }

  console.log(body.data)

  const cashfreeOrderId = body.data.order.order_id

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.cashfreeOrderId, cashfreeOrderId))
  if (!order) {
    // Unknown order — ack anyway so Cashfree doesn't retry indefinitely.
    return NextResponse.json({ received: true })
  }

  if (body.type === "PAYMENT_SUCCESS_WEBHOOK") {
    // Idempotent: a webhook retry must not double-confirm or double-redeem.
    if (order.status === "placed") {
      await db
        .update(orders)
        .set({
          status: "confirmed",
          cashfreePaymentId: body.data.payment?.cf_payment_id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))

      await db
        .insert(orderStatusHistory)
        .values({ orderId: order.id, status: "confirmed" })

      if (order.promoCode) {
        await db
          .insert(promoRedemptions)
          .values({
            promoCode: order.promoCode,
            userId: order.userId,
            orderId: order.id,
          })
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
            orderNumber: order.orderSeq,
            items: order.items,
            subtotal: order.subtotal,
            discount: order.discount,
            promoCode: order.promoCode,
            total: order.total,
          }),
        })
      }
    }
  } else if (body.type === "REFUND_STATUS_WEBHOOK") {
    const refund = body.data.refund
    // Idempotent: a webhook retry must not double-apply a refund.
    if (
      refund &&
      refund.refund_status === "SUCCESS" &&
      order.status !== "refunded"
    ) {
      const refundedAmountPaise = Math.round(refund.refund_amount * 100)

      await db
        .update(orders)
        .set({
          status: "refunded",
          refundId: refund.refund_id,
          refundedAmount: refundedAmountPaise,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))

      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "refunded",
        note: `Refund of ${formatRupees(refundedAmountPaise)} processed via Cashfree (refund_id=${refund.refund_id})`,
      })
    }
  }

  // PAYMENT_FAILED_WEBHOOK / PAYMENT_USER_DROPPED_WEBHOOK: the order stays
  // "placed" so checkout can retry with the same cart — see DESIGN.md §
  // Checkout States.

  return NextResponse.json({ received: true })
}
