"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, MapPin, Package, UserRound } from "lucide-react"

import { cn } from "@/lib/utils"

const TABS = [
  { href: "/account/profile", label: "Overview", icon: UserRound },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/addresses", label: "My Addresses", icon: MapPin },
] as const

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-6 overflow-hidden rounded-xl border border-border">
      {TABS.map((tab, i) => {
        const active = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
              i > 0 && "border-t border-border",
              active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            <span className="flex-1">{tab.label}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        )
      })}
    </nav>
  )
}
