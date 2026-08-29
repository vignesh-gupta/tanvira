"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSendOtp() {
    if (!email.trim()) return
    setLoading(true)
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
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!otp.trim()) return
    setLoading(true)
    try {
      const { error } = await authClient.signIn.emailOtp({ email, otp })
      if (error) {
        toast.error(error.message ?? "That code didn't match — check and try again")
        return
      }
      router.push("/account/orders")
    } catch {
      toast.error("That code didn't match — check and try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="mb-2 font-heading text-2xl">Track Order / Login</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        No password needed — we&apos;ll email you a one-time code.
      </p>

      <div className="space-y-4">
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
          <Button className="w-full" onClick={handleSendOtp} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Send code"}
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
            <Button className="w-full" onClick={handleVerify} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify & Continue"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
