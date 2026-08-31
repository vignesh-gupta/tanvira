import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { auth } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link href="/admin" className="font-heading text-lg">
          Tanvira Admin
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to store
        </Link>
      </header>
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
