"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PackageSearch, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/admin/orders", label: "Orders", icon: PackageSearch },
  { href: "/admin/users", label: "Users & Admin", icon: Users },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-border px-4 sm:px-6">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
