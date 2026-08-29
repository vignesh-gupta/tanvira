import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins/email-otp"

import { db } from "@/db"
import * as schema from "@/db/schema"
import { EMAIL_FROM, resend } from "@/lib/email/resend"
import { OtpEmail } from "@/lib/email/templates/otp-email"

// Email-only, passwordless auth — no password field is ever set or checked.
// Checkout submits name + email, the customer verifies the OTP, and Better
// Auth silently creates the account on first success. The same mechanism
// powers the returning-customer "Track Order / Login" entry point.
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // Required — without an explicit schema, the adapter can't resolve
    // model names like "verification" to their Drizzle table objects and
    // every auth call (including OTP send/verify) fails at runtime.
    schema,
  }),
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      // Checkout never shows a separate "sign up" screen — a first-time
      // email at checkout should silently create the account.
      disableSignUp: false,
      async sendVerificationOTP({ email, otp, type }) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: email,
          subject:
            type === "sign-in"
              ? "Your Tanvira sign-in code"
              : "Your Tanvira verification code",
          react: OtpEmail({ otp, purpose: type }),
        })
      },
    }),
  ],
})
