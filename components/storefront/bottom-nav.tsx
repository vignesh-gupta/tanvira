"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingBag, Store, User } from "lucide-react"

import { useCart } from "@/lib/cart/cart-context"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/products", label: "Shop", icon: Store, match: (p: string) => p.startsWith("/products") },
  { href: "/cart", label: "Cart", icon: ShoppingBag, match: (p: string) => p.startsWith("/cart") },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const { count } = useCart()
  const { data: session } = authClient.useSession()

  const accountHref = session?.user ? "/account/profile" : "/login"
  const accountActive = pathname.startsWith("/account") || pathname.startsWith("/login")

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-sidebar-border bg-sidebar text-sidebar-foreground sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
              active ? "text-sidebar-primary" : "text-sidebar-foreground/70",
            )}
          >
            <Icon className="size-5" />
            {label}
            {href === "/cart" && count > 0 ? (
              <span className="absolute top-1 right-[calc(50%-18px)] flex size-4 items-center justify-center rounded-full bg-sidebar-primary text-[9px] font-medium text-sidebar-primary-foreground">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>
        )
      })}
      <Link
        href={accountHref}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
          accountActive ? "text-sidebar-primary" : "text-sidebar-foreground/70",
        )}
      >
        <User className="size-5" />
        Account
      </Link>
    </nav>
  )
}
