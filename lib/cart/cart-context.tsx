"use client"

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react"

export interface CartItem {
  productId: string
  name: string
  price: number // paise
  qty: number
  image?: string
  slug: string
}

const STORAGE_KEY = "tanvira-cart"
const EMPTY: CartItem[] = []

// Module-level store backing useSyncExternalStore — the sanctioned React
// pattern for syncing an external source (localStorage) without a
// setState-in-effect hydration mismatch. getServerSnapshot always returns
// EMPTY, matching SSR output; React reconciles to the real snapshot right
// after hydration.
let cartSnapshot: CartItem[] = EMPTY
const listeners = new Set<() => void>()

function loadFromStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

if (typeof window !== "undefined") {
  cartSnapshot = loadFromStorage()
}

function setCart(next: CartItem[]) {
  cartSnapshot = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable (private mode, quota) — cart still works in-memory
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return cartSnapshot
}

function getServerSnapshot() {
  return EMPTY
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  subtotal: number
  count: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const addItem = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    const existing = cartSnapshot.find((i) => i.productId === item.productId)
    const next = existing
      ? cartSnapshot.map((i) =>
          i.productId === item.productId ? { ...i, qty: i.qty + qty } : i,
        )
      : [...cartSnapshot, { ...item, qty }]
    setCart(next)
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    const next =
      qty <= 0
        ? cartSnapshot.filter((i) => i.productId !== productId)
        : cartSnapshot.map((i) => (i.productId === productId ? { ...i, qty } : i))
    setCart(next)
  }, [])

  const removeItem = useCallback((productId: string) => {
    setCart(cartSnapshot.filter((i) => i.productId !== productId))
  }, [])

  const clear = useCallback(() => setCart([]), [])

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items])
  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clear, subtotal, count }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within a CartProvider")
  return ctx
}
