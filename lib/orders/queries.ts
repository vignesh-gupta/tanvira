import { useMutation } from "@tanstack/react-query"

import type { AddressFormValues } from "@/components/storefront/address-form"

interface CreateOrderInput {
  items: { productId: string; name: string; price: number; qty: number }[]
  promoCode?: string
  addressId?: string
  shippingAddress?: AddressFormValues
}

interface CreateOrderResult {
  orderId: string
  paymentSessionId: string
  total: number
}

async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Couldn't create the order")
  }
  return data
}

export function useCreateOrder() {
  return useMutation({ mutationFn: createOrder })
}

interface ShipOrderInput {
  orderId: string
  trackingUrl: string
}

async function shipOrder({ orderId, trackingUrl }: ShipOrderInput) {
  const res = await fetch(`/api/orders/${orderId}/ship`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackingUrl }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Couldn't ship the order.")
  }
  return data
}

export function useShipOrder() {
  return useMutation({ mutationFn: shipOrder })
}
