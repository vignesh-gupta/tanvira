"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { CartProvider } from "@/lib/cart/cart-context"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <CartProvider>{children}</CartProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
