"use client"

import { useState } from "react"
import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface AppliedPromo {
  code: string
  discountAmount: number // paise
}

export function PromoCodeInput({
  cartTotal,
  onApplied,
}: {
  cartTotal: number
  onApplied: (promo: AppliedPromo | null) => void
}) {
  const [code, setCode] = useState("")
  const [applied, setApplied] = useState<AppliedPromo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
        const promo = { code: data.code, discountAmount: data.discountAmount }
        setApplied(promo)
        onApplied(promo)
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
    setApplied(null)
    setCode("")
    setError(null)
    onApplied(null)
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
