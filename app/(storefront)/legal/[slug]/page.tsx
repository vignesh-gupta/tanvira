import { notFound } from "next/navigation"

const LEGAL_PAGES: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect only what's needed to process your order: your name, email, delivery address, and phone number as a delivery-contact field.",
      "We never sell your data. Payment details are handled entirely by Cashfree and never touch our servers.",
      "Your email is used for order updates and, if you choose, to sign in via a one-time code — we never ask for or store a password.",
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      "By placing an order with Tanvira, you agree to pay the listed price at checkout, inclusive of any applicable charges shown before payment.",
      "All jewellery sold is imitation/fashion jewellery — gold-plated brass and artificial stones, not fine or precious jewellery — as described on each product page.",
      "Orders are confirmed only once payment is verified. You'll receive an email confirmation and can track status anytime via your order link.",
    ],
  },
  "shipping-returns": {
    title: "Shipping & Returns",
    body: [
      "We currently ship across India only. Delivery timelines are shared on your Order Status page once your order is confirmed.",
      "If you receive a damaged or incorrect item, contact us via WhatsApp within 48 hours of delivery with photos of the item.",
      "Return/refund eligibility is assessed case by case — reach out and we'll sort it out quickly.",
    ],
  },
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = LEGAL_PAGES[slug]

  if (!page) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl">{page.title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        {page.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}
