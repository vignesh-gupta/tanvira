import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-12">
        <div>
          <p className="font-heading text-lg">Tanvira</p>
          <p className="mt-2 text-sm text-sidebar-foreground/70">
            Affordable fashion jewellery for everyday wear and gifting.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Quick Links</span>
          <Link href="/" className="text-sidebar-foreground/70 hover:text-sidebar-primary">
            Home
          </Link>
          <Link href="/products" className="text-sidebar-foreground/70 hover:text-sidebar-primary">
            Shop
          </Link>
          <a
            href="https://wa.me/910000000000"
            className="text-sidebar-foreground/70 hover:text-sidebar-primary"
          >
            WhatsApp us
          </a>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Store Policy</span>
          <Link href="/legal/shipping-returns" className="text-sidebar-foreground/70 hover:text-sidebar-primary">
            Shipping &amp; Returns
          </Link>
          <Link href="/legal/privacy" className="text-sidebar-foreground/70 hover:text-sidebar-primary">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="text-sidebar-foreground/70 hover:text-sidebar-primary">
            Terms of Service
          </Link>
        </div>
      </div>
      <div className="border-t border-sidebar-border px-4 py-4 text-center text-xs text-sidebar-foreground/60 sm:px-6">
        © {new Date().getFullYear()} Tanvira. All rights reserved.
      </div>
    </footer>
  )
}
