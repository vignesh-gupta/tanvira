"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, User } from "lucide-react"

import { useCart } from "@/lib/cart/cart-context"
import { cn } from "@/lib/utils"

export function HeaderNav() {
  const { count } = useCart()

  return (
    <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="Tanvira"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="font-heading text-lg tracking-wide">Tanvira</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <Link href="/products" className="transition-colors hover:text-sidebar-primary">
            Shop
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            aria-label="Track order or login"
            className="transition-colors hover:text-sidebar-primary"
          >
            <User className="size-5" />
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative transition-colors hover:text-sidebar-primary"
          >
            <ShoppingBag className="size-5" />
            <span
              className={cn(
                "absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-medium text-sidebar-primary-foreground transition-transform duration-150",
                count > 0 ? "scale-100" : "scale-0",
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
