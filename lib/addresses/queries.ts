import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { AddressData } from "@/components/storefront/address-card"
import type { AddressFormValues } from "@/components/storefront/address-form"

export const addressKeys = {
  all: ["addresses"] as const,
}

async function fetchAddresses(): Promise<AddressData[]> {
  const res = await fetch("/api/addresses")
  const data = await res.json()
  return data.addresses
}

export function useAddresses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: addressKeys.all,
    queryFn: fetchAddresses,
    enabled: options?.enabled,
  })
}

async function sendAddress(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Something went wrong")
  }
  return data
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: AddressFormValues) => sendAddress("/api/addresses", "POST", values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AddressFormValues }) =>
      sendAddress(`/api/addresses/${id}`, "PATCH", values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sendAddress(`/api/addresses/${id}`, "DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  })
}
