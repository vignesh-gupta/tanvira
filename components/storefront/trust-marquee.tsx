const BADGES = [
  "COD Available",
  "Easy 7-Day Returns",
  "Skin-Friendly Materials",
  "Secure Checkout",
]

// Static copy, doubled so the CSS animation can loop seamlessly.
export function TrustMarquee() {
  const items = [...BADGES, ...BADGES]

  return (
    <div className="overflow-hidden border-b border-border bg-muted py-2">
      <div className="animate-marquee flex w-max gap-8 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {items.map((label, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2">
            <span className="size-1 rounded-full bg-secondary" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
