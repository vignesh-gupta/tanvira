import { headers } from "next/headers"

import { UsersTable } from "@/components/admin/users-table"
import { auth } from "@/lib/auth"

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const { users } = await auth.api.listUsers({
    query: { limit: 200, sortBy: "createdAt", sortDirection: "desc" },
    headers: await headers(),
  })

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl">Users &amp; Admin</h1>
      <UsersTable
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role ?? "user",
          createdAt: u.createdAt,
        }))}
        currentUserId={session?.user.id ?? ""}
      />
    </div>
  )
}
