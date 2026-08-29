"use client"

import Script from "next/script"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { CheckoutSteps } from "@/components/storefront/checkout-steps"
import { PromoCodeInput, type AppliedPromo } from "@/components/storefront/promo-code-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { useCart } from "@/lib/cart/cart-context"
import { formatRupees } from "@/lib/format"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

type Address = {
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  phone: string
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1 — details + OTP
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Step 2 — address
  const [address, setAddress] = useState<Address>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  })

  // Step 3 — promo + payment
  const [promo, setPromo] = useState<AppliedPromo | null>(null)
  const [paying, setPaying] = useState(false)

  const discount = promo?.discountAmount ?? 0
  const total = Math.max(subtotal - discount, 0)

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

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep(3)
  }

  async function handlePay() {
    setPaying(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            qty: i.qty,
          })),
          promoCode: promo?.code,
          shippingAddress: address,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error?.message ?? "Couldn't create the order")
        setPaying(false)
        return
      }

      const { orderId, razorpayOrderId, total: orderTotal } = await res.json()

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderTotal,
        currency: "INR",
        name: "Tanvira",
        order_id: razorpayOrderId,
        prefill: { name, email },
        theme: { color: "#5B0E22" },
        handler: () => {
          clear()
          router.push(`/orders/${orderId}/confirmation`)
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      })
      razorpay.open()
    } catch {
      toast.error("Something went wrong starting payment — please retry")
      setPaying(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <CheckoutSteps currentStep={step} />

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
        <form onSubmit={handleAddressSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="line1">Address line 1</Label>
            <Input
              id="line1"
              required
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line2">Address line 2 (optional)</Label>
            <Input
              id="line2"
              value={address.line2}
              onChange={(e) => setAddress({ ...address, line2: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                required
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">PIN</Label>
              <Input
                id="pincode"
                required
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone (for delivery contact)</Label>
            <Input
              id="phone"
              required
              value={address.phone}
              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full">
            Continue to Payment
          </Button>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-4">
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

          <PromoCodeInput cartTotal={subtotal} onApplied={setPromo} />

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
