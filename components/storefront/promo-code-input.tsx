"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { usePromoStore, type AppliedPromo } from "@/lib/promo/promo-store"
import { useApplyPromoMutation, usePromoRevalidation } from "@/lib/promo/queries"

export type { AppliedPromo }

export function PromoCodeInput({ cartTotal }: { cartTotal: number }) {
  const applied = usePromoStore((s) => s.promo)
  const setPromo = usePromoStore((s) => s.setPromo)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const applyPromo = useApplyPromoMutation()
  const revalidation = usePromoRevalidation(applied?.code, cartTotal)

  useEffect(() => {
    if (!revalidation.data) return
    if (revalidation.data.valid) {
      setPromo({ code: revalidation.data.code!, discountAmount: revalidation.data.discountAmount! })
    } else {
      setPromo(null)
    }
  }, [revalidation.data, setPromo])

  function handleApply() {
    if (!code.trim()) return
    setError(null)

    applyPromo.mutate(
      { code, cartTotal },
      {
        onSuccess: (data) => {
          if (data.valid) {
            setPromo({ code: data.code!, discountAmount: data.discountAmount! })
          } else {
            setError(data.reason ?? "Invalid promo code.")
          }
        },
        onError: () => setError("Couldn't validate that code — please try again."),
      },
    )
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
        <Button type="button" variant="secondary" onClick={handleApply} disabled={applyPromo.isPending}>
          {applyPromo.isPending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
