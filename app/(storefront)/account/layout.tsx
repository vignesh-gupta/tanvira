import { AccountNav } from "@/components/storefront/account-nav"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 sm:pt-8">
      <AccountNav />
      {children}
    </div>
  )
}
