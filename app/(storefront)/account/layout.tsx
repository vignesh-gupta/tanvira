import { AccountNav } from "@/components/storefront/account-nav"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 sm:px-6">
      <AccountNav />
      {children}
    </div>
  )
}
