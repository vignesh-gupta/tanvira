"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart/cart-context"

export function PdpAddToCart({
  productId,
  name,
  price,
  image,
  slug,
  stock,
}: {
  productId: string
  name: string
  price: number
  image?: string
  slug: string
  stock: number
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const outOfStock = stock <= 0

  function handleAdd() {
    addItem({ productId, name, price, image, slug })
    toast.success(`${name} added to cart`)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Button
      size="lg"
      onClick={handleAdd}
      disabled={outOfStock}
      className="w-full transition-transform duration-150 active:scale-[0.98] sm:w-auto"
    >
      {outOfStock ? "Out of stock" : added ? "Added ✓" : "Add to Cart"}
    </Button>
  )
}
