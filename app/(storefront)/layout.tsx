import { BottomNav } from "@/components/storefront/bottom-nav"
import { HeaderNav } from "@/components/storefront/header-nav"
import { Footer } from "@/components/storefront/footer"
import { TrustMarquee } from "@/components/storefront/trust-marquee"

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <HeaderNav />
      <TrustMarquee />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  )
}
