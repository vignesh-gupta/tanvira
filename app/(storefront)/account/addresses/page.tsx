import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AddressesManager } from "@/components/storefront/addresses-manager"
import { auth } from "@/lib/auth"

export default async function AddressesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  return (
    <div className="pb-8">
      <h1 className="mb-6 font-heading text-2xl">My Addresses</h1>
      <AddressesManager />
    </div>
  )
}
