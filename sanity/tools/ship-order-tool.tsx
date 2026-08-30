import { useState } from "react"

const SECRET_STORAGE_KEY = "tanvira_admin_api_secret"

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
  width: "100%",
}

// Sanity Studio has no knowledge of Postgres orders — this tool is a thin
// form over POST /api/orders/[id]/ship, gated by ADMIN_API_SECRET since
// there's no admin role in Better Auth to check instead (see ARCHITECTURE.md
// § Security Model). The secret is entered once and kept in this browser's
// localStorage, not committed anywhere.
export function ShipOrderTool() {
  const [orderId, setOrderId] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")
  const [secret, setSecret] = useState(() => localStorage.getItem(SECRET_STORAGE_KEY) ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    localStorage.setItem(SECRET_STORAGE_KEY, secret)

    try {
      const res = await fetch(`/api/orders/${orderId.trim()}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ trackingUrl: trackingUrl.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setResult({ ok: false, message: data.error?.message ?? "Couldn't ship the order." })
        return
      }
      setResult({ ok: true, message: `Order ${data.id} marked as shipped.` })
      setOrderId("")
      setTrackingUrl("")
    } catch {
      setResult({ ok: false, message: "Network error — please retry." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Ship Order</h2>
          <p style={{ margin: "0.5rem 0 0", fontSize: 13, color: "#666" }}>
            Marks a confirmed order as shipped. A tracking URL is required — it&apos;s shown to
            the customer on their Order Status page.
          </p>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Order ID
          <input
            style={inputStyle}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. 3f9c1a2b-..."
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Tracking URL
          <input
            type="url"
            style={inputStyle}
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="https://track.example.com/AWB1234"
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Admin secret
          <input
            type="password"
            style={inputStyle}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="ADMIN_API_SECRET"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "none",
            background: "#5B0E22",
            color: "#fff",
            fontSize: 14,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Shipping…" : "Mark as shipped"}
        </button>

        {result ? (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 6,
              fontSize: 13,
              background: result.ok ? "#e6f4ea" : "#fce8e6",
              color: result.ok ? "#137333" : "#c5221f",
            }}
          >
            {result.message}
          </div>
        ) : null}
      </form>
    </div>
  )
}
