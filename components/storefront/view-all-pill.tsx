import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function ViewAllPill({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      {label}
      <ArrowRight className="size-3.5" />
    </Link>
  )
}
