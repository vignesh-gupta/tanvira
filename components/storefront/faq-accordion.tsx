import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    question: "How long does delivery take?",
    answer:
      "Most orders are dispatched within 1–2 business days and delivered within 4–7 business days across India.",
  },
  {
    question: "Is Cash on Delivery available?",
    answer: "Yes, COD is available on all orders alongside online payment options.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer easy 7-day returns on unused items in their original packaging. See our Shipping & Returns page for details.",
  },
  {
    question: "Are the materials skin-friendly?",
    answer:
      "Yes — our pieces are made with skin-friendly, tarnish-resistant materials suited for everyday wear.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order ships, a tracking link appears on your Order Status page under My Orders.",
  },
]

export function FaqAccordion() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h2 className="mb-4 text-center font-heading text-xl sm:mb-6 sm:text-2xl">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible>
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
