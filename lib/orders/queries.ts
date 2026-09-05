import { useMutation } from "@tanstack/react-query"

import type { AddressFormValues } from "@/components/storefront/address-form"
import { fetchJson } from "@/lib/http"

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

function createOrder(input: CreateOrderInput) {
  return fetchJson<CreateOrderResult>("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}

// No cache to invalidate here — order history (account/orders) and the
// confirmation page are both server components that read straight from the
// DB on navigation, not react-query consumers.
export function useCreateOrder() {
  return useMutation({ mutationFn: createOrder })
}

interface ShipOrderInput {
  orderId: string
  trackingUrl: string
}

function shipOrder({ orderId, trackingUrl }: ShipOrderInput) {
  return fetchJson(`/api/orders/${orderId}/ship`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackingUrl }),
  })
}

// Same reasoning as useCreateOrder: the admin orders table is a server
// component, so there's no react-query cache for it — callers refresh it via
// router.refresh() (see components/admin/orders-table.tsx), not
// invalidateQueries. Only client-fetched lists (e.g. useAddresses) use
// invalidateQueries; keep that split rather than mixing the two per-caller.
export function useShipOrder() {
  return useMutation({ mutationFn: shipOrder })
}
