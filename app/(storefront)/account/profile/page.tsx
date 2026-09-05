import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl">Profile</h1>

      <div className="divide-y divide-border rounded-lg border border-border">
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-muted-foreground">Name</span>
          <span className="text-sm font-medium">{session.user.name || "—"}</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-sm font-medium">{session.user.email}</span>
        </div>
      </div>
    </div>
  )
}
