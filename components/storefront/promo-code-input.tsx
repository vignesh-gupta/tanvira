"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { usePromoStore, type AppliedPromo } from "@/lib/promo/promo-store"

export type { AppliedPromo }

export function PromoCodeInput({ cartTotal }: { cartTotal: number }) {
  const applied = usePromoStore((s) => s.promo)
  const setPromo = usePromoStore((s) => s.setPromo)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // An already-applied promo (persisted across pages, or auto-applied from a
  // `?promo=` link before anything was in the cart) was validated against
  // whatever the subtotal was at that moment — re-validate against the
  // current subtotal whenever it changes so the discount amount (and
  // continued validity) stays correct instead of going stale.
  const appliedCode = applied?.code
  useEffect(() => {
    if (!appliedCode) return
    fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: appliedCode, cartTotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setPromo({ code: data.code, discountAmount: data.discountAmount })
        } else {
          setPromo(null)
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCode, cartTotal])

  async function handleApply() {
    if (!code.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartTotal }),
      })
      const data = await res.json()

      if (data.valid) {
        setPromo({ code: data.code, discountAmount: data.discountAmount })
      } else {
        setError(data.reason ?? "Invalid promo code.")
      }
    } catch {
      setError("Couldn't validate that code — please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleRemove() {
    setPromo(null)
    setCode("")
    setError(null)
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
        <span className="text-success">✓ {applied.code} applied</span>
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1 text-muted-foreground underline transition-colors hover:text-destructive"
        >
          <X className="size-3.5" /> Remove
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Promo code"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className={cn(error && "border-destructive")}
        />
        <Button type="button" variant="secondary" onClick={handleApply} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
