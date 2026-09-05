import { eq } from "drizzle-orm"

import { db } from "@/db"
import { addresses } from "@/db/schema"
import type { ShippingAddressInput } from "@/lib/validations/order"

// Shared by /api/addresses (explicit save) and /api/orders (checkout's
// "add new address" path, which also persists it as a saved address) so
// the isDefault-promotion logic can't drift between the two callers.
export async function createAddressForUser(
  userId: string,
  input: ShippingAddressInput,
  opts?: { isDefault?: boolean },
) {
  const existing = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .limit(1)

  // First address is always the default, regardless of what was requested.
  const makeDefault = opts?.isDefault ?? existing.length === 0

  if (makeDefault && existing.length > 0) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId))
  }

  const [address] = await db
    .insert(addresses)
    .values({ userId, ...input, isDefault: makeDefault })
    .returning()

  return address
}
