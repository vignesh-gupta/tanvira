import crypto from "node:crypto"
import { randomUUID } from "node:crypto"

const API_VERSION = "2026-01-01"

function baseUrl() {
  return process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg"
}

function authHeaders() {
  return {
    "content-type": "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": process.env.CASHFREE_CLIENT_ID!,
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
  }
}

interface CashfreeCustomer {
  id: string
  name: string
  email: string
  phone: string
}

interface CreateOrderResult {
  cfOrderId: string
  paymentSessionId: string
}

/** Amount must be an integer number of paise (INR's smallest unit) — Cashfree's API takes decimal rupees. */
export async function createCashfreeOrder(params: {
  orderId: string
  amountInPaise: number
  customer: CashfreeCustomer
  returnUrl: string
  note: string
}): Promise<CreateOrderResult> {
  const res = await fetch(`${baseUrl()}/orders`, {
    method: "POST",
    headers: { ...authHeaders(), "x-idempotency-key": randomUUID() },
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amountInPaise / 100,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customer.id,
        customer_name: params.customer.name,
        customer_email: params.customer.email,
        customer_phone: params.customer.phone,
      },
      order_note: params.note,
      order_meta: { return_url: params.returnUrl },
    }),
  })

  if (!res.ok) {
    throw new Error(`Cashfree order creation failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return { cfOrderId: data.cf_order_id, paymentSessionId: data.payment_session_id }
}

interface CashfreeOrderStatus {
  orderStatus: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED"
}

/** Read-only status check — never used for polling, only a single call on redirect-back. */
export async function getCashfreeOrder(cashfreeOrderId: string): Promise<CashfreeOrderStatus | null> {
  const res = await fetch(`${baseUrl()}/orders/${cashfreeOrderId}`, {
    headers: authHeaders(),
    cache: "no-store",
  })
  if (!res.ok) return null

  const data = await res.json()
  return { orderStatus: data.order_status }
}

/**
 * Checked at order creation, live, instead of mirroring incidents into our
 * own DB — Cashfree's incident status is the source of truth and this is a
 * single request per checkout attempt, not a poll.
 */
export async function hasActiveHighImpactIncident(): Promise<boolean> {
  const res = await fetch(`${baseUrl()}/incident?incident_status=ACTIVE&incident_impact=HIGH`, {
    headers: authHeaders(),
    cache: "no-store",
  })
  if (!res.ok) return false

  const data = await res.json()
  return Array.isArray(data) ? data.length > 0 : (data.count ?? 0) > 0
}

export async function createCashfreeRefund(params: {
  cashfreeOrderId: string
  refundId: string
  amountInPaise: number
  note: string
}) {
  const res = await fetch(`${baseUrl()}/orders/${params.cashfreeOrderId}/refunds`, {
    method: "POST",
    headers: { ...authHeaders(), "x-idempotency-key": randomUUID() },
    body: JSON.stringify({
      refund_id: params.refundId,
      refund_amount: params.amountInPaise / 100,
      refund_note: params.note,
    }),
  })

  if (!res.ok) {
    throw new Error(`Cashfree refund creation failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}

/**
 * Verifies the `x-webhook-signature` header against `timestamp + rawBody`
 * using CASHFREE_CLIENT_SECRET — Cashfree signs with the account secret
 * rather than a separate webhook secret. Shared by the payment webhook and
 * the incident webhook, which use the identical scheme. An order's status
 * must never advance on a payload that fails this check.
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  if (!timestamp || !signature) return false

  const expected = crypto
    .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET!)
    .update(timestamp + rawBody)
    .digest("base64")

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
