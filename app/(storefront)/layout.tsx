import { HeaderNav } from "@/components/storefront/header-nav"
import { Footer } from "@/components/storefront/footer"

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <HeaderNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
