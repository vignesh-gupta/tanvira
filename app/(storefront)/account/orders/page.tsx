import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { desc, eq } from "drizzle-orm"
import { PackageOpen } from "lucide-react"

import { StatusBadge } from "@/components/storefront/status-badge"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { orders } from "@/db/schema"
import { formatRupees } from "@/lib/format"

export default async function OrderHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))
    .limit(20)

  if (myOrders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <PackageOpen className="size-10 text-muted-foreground" />
        <p className="text-lg text-foreground">No orders yet</p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <h1 className="mb-6 font-heading text-2xl">Order History</h1>

      <div className="divide-y divide-border rounded-lg border border-border">
        {myOrders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex items-center justify-between p-4 transition-colors hover:bg-muted"
          >
            <div>
              <p className="text-sm font-medium">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground">{formatRupees(order.total)}</p>
            </div>
            <StatusBadge status={order.status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
