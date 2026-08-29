import { Resend } from "resend"

// Constructed lazily — Resend's constructor throws synchronously on a
// missing/malformed key, and this module is imported by lib/auth.ts, which
// nearly every page touches via session checks. An eager `new Resend(...)`
// at module load would take down the entire app (not just email sending)
// whenever RESEND_API_KEY isn't configured yet, e.g. in local dev before
// secrets are set. Deferring construction means only an actual send
// attempt fails, which callers already handle (see checkout's try/catch).
let client: Resend | undefined

export const resend = {
  emails: {
    send(...args: Parameters<Resend["emails"]["send"]>) {
      if (!client) client = new Resend(process.env.RESEND_API_KEY)
      return client.emails.send(...args)
    },
  },
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Tanvira <onboarding@resend.dev>"
