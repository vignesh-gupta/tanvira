// @cashfreepayments/cashfree-js ships no type declarations — this covers the
// narrow surface this app actually uses (see checkout/page.tsx).
declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string
    redirectTarget?: "_self" | "_blank" | "_modal"
  }

  export interface Cashfree {
    checkout: (options: CashfreeCheckoutOptions) => void
  }

  export function load(options: { mode: "sandbox" | "production" }): Promise<Cashfree>
}
