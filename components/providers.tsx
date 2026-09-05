"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { CartProvider } from "@/lib/cart/cart-context"
import { ThemeProvider } from "@/components/theme-provider"
import { PromoUrlSync } from "@/components/storefront/promo-url-sync"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  )

  return (
    <ThemeProvider>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <PromoUrlSync />
            {children}
          </CartProvider>
        </QueryClientProvider>
      </NuqsAdapter>
    </ThemeProvider>
  )
}
