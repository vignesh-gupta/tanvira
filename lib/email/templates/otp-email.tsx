import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface OtpEmailProps {
  otp: string
  purpose: "sign-in" | "email-verification" | "forget-password" | "change-email"
}

const PURPOSE_COPY: Record<OtpEmailProps["purpose"], string> = {
  "sign-in": "Use this code to sign in to Tanvira.",
  "email-verification": "Use this code to verify your email address.",
  "forget-password": "Use this code to reset your password.",
  "change-email": "Use this code to confirm your new email address.",
}

export function OtpEmail({ otp, purpose }: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Tanvira verification code: {otp}</Preview>
      <Body style={{ backgroundColor: "#F7F1E8", fontFamily: "Inter, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#FFFDF8",
            margin: "40px auto",
            padding: "32px",
            borderRadius: "16px",
            maxWidth: "420px",
          }}
        >
          <Heading style={{ color: "#5B0E22", fontSize: "20px" }}>Tanvira</Heading>
          <Text style={{ color: "#2A1015", fontSize: "15px" }}>
            {PURPOSE_COPY[purpose]}
          </Text>
          <Section
            style={{
              backgroundColor: "#F7F1E8",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              margin: "24px 0",
            }}
          >
            <Text
              style={{
                fontSize: "32px",
                fontWeight: 600,
                letterSpacing: "0.3em",
                color: "#5B0E22",
                margin: 0,
              }}
            >
              {otp}
            </Text>
          </Section>
          <Text style={{ color: "#7A6A5D", fontSize: "13px" }}>
            This code expires in 5 minutes. If you didn&apos;t request this, you can
            safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
