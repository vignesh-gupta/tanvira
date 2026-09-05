import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface OrderConfirmationEmailProps {
  orderNumber: number
  items: { name: string; qty: number; price: number }[]
  total: number // paise
}

const formatRupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`
const formatOrderNumber = (orderSeq: number) => `TVA${orderSeq}`

export function OrderConfirmationEmail({
  orderNumber,
  items,
  total,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Tanvira order is confirmed</Preview>
      <Body style={{ backgroundColor: "#F7F1E8", fontFamily: "Inter, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#FFFDF8",
            margin: "40px auto",
            padding: "32px",
            borderRadius: "16px",
            maxWidth: "480px",
          }}
        >
          <Heading style={{ color: "#5B0E22", fontSize: "20px" }}>
            Order confirmed
          </Heading>
          <Text style={{ color: "#2A1015", fontSize: "15px" }}>
            Thank you for your order! We&apos;ll let you know as soon as it ships.
          </Text>
          <Text style={{ color: "#7A6A5D", fontSize: "13px" }}>
            Order ID: {formatOrderNumber(orderNumber)}
          </Text>
          <Hr style={{ borderColor: "#E7DCC9" }} />
          {items.map((item, i) => (
            <Section key={i} style={{ marginBottom: "8px" }}>
              <Text style={{ color: "#2A1015", fontSize: "14px", margin: 0 }}>
                {item.name} × {item.qty} — {formatRupees(item.price * item.qty)}
              </Text>
            </Section>
          ))}
          <Hr style={{ borderColor: "#E7DCC9" }} />
          <Text style={{ color: "#5B0E22", fontSize: "16px", fontWeight: 600 }}>
            Total: {formatRupees(total)}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
