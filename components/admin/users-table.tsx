"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"
import { formatDate } from "@/lib/format"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[]
  currentUserId: string
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell>
                <RoleSelect user={user} disabled={user.id === currentUserId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RoleSelect({ user, disabled }: { user: UserRow; disabled: boolean }) {
  const router = useRouter()
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)

  async function handleChange(nextRole: string) {
    const previous = role
    setRole(nextRole)
    setSaving(true)

    const { error } = await authClient.admin.setRole({
      userId: user.id,
      role: nextRole as "user" | "admin",
    })

    if (error) {
      setRole(previous)
      toast.error(error.message ?? "Couldn't update role.")
    } else {
      toast.success(`${user.name} is now ${nextRole}.`)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={disabled || saving}>
      <SelectTrigger className="w-28" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">User</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  )
}
