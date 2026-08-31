import { desc, eq } from "drizzle-orm"

import { OrdersTable } from "@/components/admin/orders-table"
import { db } from "@/db"
import { orders, user } from "@/db/schema"

export default async function AdminOrdersPage() {
  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      trackingUrl: orders.trackingUrl,
      createdAt: orders.createdAt,
      customerName: user.name,
      customerEmail: user.email,
    })
    .from(orders)
    .innerJoin(user, eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(200)

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl">Orders</h1>
      <OrdersTable orders={rows} />
    </div>
  )
}
