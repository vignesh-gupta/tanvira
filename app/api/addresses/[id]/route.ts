import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { addresses, orders } from "@/db/schema"
import { apiError } from "@/lib/api-response"
import { upsertAddressSchema } from "@/lib/validations/order"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return apiError(401, "unauthorized", "You must be signed in to edit an address.")
  }

  const { id } = await params
  const [existing] = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1)
  if (!existing || existing.userId !== session.user.id) {
    return apiError(404, "not_found", "Address not found.")
  }

  const parsed = upsertAddressSchema.safeParse(await request.json())
  if (!parsed.success) {
    return apiError(400, "validation_error", parsed.error.issues[0]?.message ?? "Invalid address.")
  }
  const { isDefault, ...input } = parsed.data

  if (isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, session.user.id))
  }

  const [updated] = await db
    .update(addresses)
    .set({ ...input, ...(isDefault !== undefined ? { isDefault } : {}) })
    .where(eq(addresses.id, id))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return apiError(401, "unauthorized", "You must be signed in to delete an address.")
  }

  const { id } = await params
  const [existing] = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1)
  if (!existing || existing.userId !== session.user.id) {
    return apiError(404, "not_found", "Address not found.")
  }

  // orders.addressId has onDelete: "restrict" — this check gives a clear
  // error instead of letting the DB constraint throw a raw 500.
  const [referencedByOrder] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.addressId, id))
    .limit(1)
  if (referencedByOrder) {
    return apiError(
      409,
      "address_in_use",
      "This address is used by a past order and can't be deleted.",
    )
  }

  await db.delete(addresses).where(eq(addresses.id, id))

  // Promote the most recently added remaining address to default so the
  // user always has one, rather than leaving them with none selected.
  if (existing.isDefault) {
    const [next] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, session.user.id))
      .orderBy(desc(addresses.createdAt))
      .limit(1)
    if (next) {
      await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id))
    }
  }

  return NextResponse.json({ success: true })
}
