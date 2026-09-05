import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { addresses } from "@/db/schema"
import { apiError } from "@/lib/api-response"
import { upsertAddressSchema } from "@/lib/validations/order"
import { createAddressForUser } from "@/lib/addresses"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return apiError(401, "unauthorized", "You must be signed in to view addresses.")
  }

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, session.user.id))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt))

  return NextResponse.json({ addresses: rows })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return apiError(401, "unauthorized", "You must be signed in to add an address.")
  }

  const parsed = upsertAddressSchema.safeParse(await request.json())
  if (!parsed.success) {
    return apiError(400, "validation_error", parsed.error.issues[0]?.message ?? "Invalid address.")
  }
  const { isDefault, ...input } = parsed.data

  const address = await createAddressForUser(session.user.id, input, { isDefault })
  return NextResponse.json(address, { status: 201 })
}
