"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, MapPinned, ShoppingBag, User, UserRound } from "lucide-react"

import { useCart } from "@/lib/cart/cart-context"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function HeaderNav() {
  const router = useRouter()
  const { count } = useCart()
  const { data: session, isPending } = authClient.useSession()
  const isAdmin = session?.user.role === "admin"

  async function handleLogout() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  const displayName = session?.user.name || session?.user.email || ""
  const initial = displayName.charAt(0).toUpperCase()

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
          {isAdmin ? (
            <Link href="/admin" className="transition-colors hover:text-sidebar-primary">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-4">
          {isPending ? null : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Account, signed in as ${displayName}`}
                className="outline-none"
              >
                <Avatar className="bg-sidebar-primary text-sidebar-primary-foreground">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdmin ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <LayoutDashboard />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link href="/account/profile">
                    <UserRound />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders">
                    <MapPinned />
                    Orders &amp; Addresses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              aria-label="Login"
              className="transition-colors hover:text-sidebar-primary"
            >
              <User className="size-5" />
            </Link>
          )}
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
