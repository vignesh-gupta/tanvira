// Shared client-side counterpart to lib/api-response.ts's `apiError` envelope
// (`{ error: { message } }`) — every react-query hook that hits our own API
// routes should parse/throw through this instead of reimplementing it.
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Something went wrong")
  }
  return data
}
