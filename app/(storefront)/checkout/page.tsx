"use client"

import { useEffect, useRef, useState } from "react"
import { load as loadCashfree } from "@cashfreepayments/cashfree-js"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { AddressCard } from "@/components/storefront/address-card"
import { AddressForm, type AddressFormValues } from "@/components/storefront/address-form"
import { CheckoutSteps } from "@/components/storefront/checkout-steps"
import { PromoCodeInput } from "@/components/storefront/promo-code-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { useCart } from "@/lib/cart/cart-context"
import { usePromoStore } from "@/lib/promo/promo-store"
import { formatRupees } from "@/lib/format"
import { useAddresses } from "@/lib/addresses/queries"
import { useCreateOrder } from "@/lib/orders/queries"

export default function CheckoutPage() {
  const { items, subtotal } = useCart()
  const promo = usePromoStore((s) => s.promo)
  const { data: session, isPending: sessionPending } = authClient.useSession()

  const [step, setStep] = useState<1 | 2 | 3 | null>(null)

  // Signed-in customers skip straight to the address step — no re-entering
  // name/email/OTP they've already verified in a past session.
  useEffect(() => {
    if (sessionPending || step !== null) return
    setStep(session ? 2 : 1)
  }, [sessionPending, session, step])

  // Step 1 — details + OTP (guests only)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Step 2 — address: saved cards + "add new" form
  const { data: savedAddresses } = useAddresses({ enabled: step === 2 })
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new")
  const [newAddress, setNewAddress] = useState<AddressFormValues | null>(null)
  const appliedDefaultAddress = useRef(false)

  useEffect(() => {
    if (!savedAddresses || appliedDefaultAddress.current) return
    appliedDefaultAddress.current = true
    const preferred = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]
    setSelectedAddressId(preferred ? preferred.id : "new")
  }, [savedAddresses])

  // Step 3 — payment (promo is shared global state — see lib/promo/promo-store.ts)
  const createOrder = useCreateOrder()
  const paying = createOrder.isPending

  const discount = promo?.discountAmount ?? 0
  const total = Math.max(subtotal - discount, 0)

  function goBackToAddress() {
    if (paying) return
    setStep(2)
  }

  // Better Auth's client returns { data, error } rather than throwing on
  // API errors — a bare try/catch never sees a failed OTP send/verify.
  async function handleSendOtp() {
    if (!name.trim() || !email.trim()) return
    setVerifying(true)
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      })
      if (error) {
        toast.error(error.message ?? "Couldn't send the code — check the email and try again")
        return
      }
      setOtpSent(true)
      toast.success("Code sent — check your email")
    } catch {
      toast.error("Couldn't send the code — check the email and try again")
    } finally {
      setVerifying(false)
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) return
    setVerifying(true)
    try {
      const { error } = await authClient.signIn.emailOtp({ email, otp, name })
      if (error) {
        toast.error(error.message ?? "That code didn't match — check and try again")
        return
      }
      setStep(2)
    } catch {
      toast.error("That code didn't match — check and try again")
    } finally {
      setVerifying(false)
    }
  }

  function handlePay() {
    createOrder.mutate(
      {
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        promoCode: promo?.code,
        ...(selectedAddressId !== "new"
          ? { addressId: selectedAddressId }
          : { shippingAddress: newAddress ?? undefined }),
      },
      {
        onSuccess: async ({ paymentSessionId }) => {
          // Cart is cleared on the confirmation page once payment is
          // actually confirmed, not here — the browser is about to leave
          // for Cashfree's hosted checkout page and may come straight back
          // on a failed/dropped payment (see
          // components/storefront/order-confirmation.tsx).
          const cashfree = await loadCashfree({
            mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV as "sandbox" | "production") ?? "sandbox",
          })
          cashfree.checkout({ paymentSessionId, redirectTarget: "_self" })
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  if (step === null) {
    return <div className="mx-auto max-w-md px-4 py-6 sm:px-6 sm:py-8" />
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:px-6 sm:py-8">
      <CheckoutSteps currentStep={step} onStepClick={(s) => !paying && s === 2 && setStep(2)} />

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={otpSent} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent}
            />
          </div>

          {!otpSent ? (
            <Button className="w-full" onClick={handleSendOtp} disabled={verifying}>
              {verifying ? <Loader2 className="size-4 animate-spin" /> : "Send verification code"}
            </Button>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="otp">6-digit code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button className="w-full" onClick={handleVerifyOtp} disabled={verifying}>
                {verifying ? <Loader2 className="size-4 animate-spin" /> : "Verify & Continue"}
              </Button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {savedAddresses === undefined ? (
            <p className="text-sm text-muted-foreground">Loading your addresses…</p>
          ) : (
            <>
              {savedAddresses.length > 0 && selectedAddressId !== "new" ? (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <AddressCard
                      key={addr.id}
                      address={addr}
                      selected={selectedAddressId === addr.id}
                      onSelect={() => setSelectedAddressId(addr.id)}
                    />
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setSelectedAddressId("new")}>
                    <Plus /> Add a new address
                  </Button>
                  <Button className="w-full" onClick={() => setStep(3)}>
                    Continue to Payment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedAddresses.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAddressId(savedAddresses[0].id)}
                    >
                      ← Use a saved address instead
                    </Button>
                  ) : null}
                  <AddressForm
                    initialValue={newAddress ?? undefined}
                    submitLabel="Continue to Payment"
                    onSubmit={(values) => {
                      setNewAddress(values)
                      setStep(3)
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Button type="button" variant="ghost" size="sm" onClick={goBackToAddress} disabled={paying}>
            ← Back to address
          </Button>

          <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.name} × {item.qty}
                </span>
                <span>{formatRupees(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <PromoCodeInput cartTotal={subtotal} />

          <div className="space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatRupees(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatRupees(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-medium text-foreground">
              <span>Total</span>
              <span>{formatRupees(total)}</span>
            </div>
          </div>

          <Button className="w-full" onClick={handlePay} disabled={paying}>
            {paying ? <Loader2 className="size-4 animate-spin" /> : `Pay ${formatRupees(total)}`}
          </Button>
        </div>
      )}
    </div>
  )
}
