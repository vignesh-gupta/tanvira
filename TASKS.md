# Tasks — Cashfree Migration E2E Verification

Nothing below has been run against a live Cashfree sandbox yet (no credentials in this environment). Check off as each is done.

## 1. Credentials & env

- [ ] Get sandbox `CASHFREE_CLIENT_ID` / `CASHFREE_CLIENT_SECRET` from the Cashfree dashboard, add to `.env`
- [ ] Set `CASHFREE_ENV=sandbox` and `NEXT_PUBLIC_CASHFREE_ENV=sandbox` in `.env`
- [ ] Set `ADMIN_API_SECRET` in `.env` to a random value
- [ ] Confirm `BETTER_AUTH_URL` is reachable by your browser (used to build `return_url`)

## 2. Cashfree dashboard config

- [ ] Register webhook URL for `PAYMENT_SUCCESS_WEBHOOK` / `PAYMENT_FAILED_WEBHOOK` / `REFUND_STATUS_WEBHOOK` → `<public-url>/api/webhooks/cashfree`
- [ ] Since webhooks are server-to-server, localhost won't work — expose the dev server via a tunnel (ngrok/similar) or test against a deployed preview
- [ ] Confirm sandbox test card/UPI credentials from Cashfree docs

## 3. Database

- [ ] Run `pnpm db:migrate` against the target DB (applies migrations 0004–0006)
- [ ] Run `pnpm db:seed` and confirm it succeeds with `cashfreeOrderId`/`cashfreePaymentId` columns

## 4. Checkout happy path

- [ ] Place an order, confirm redirect to Cashfree hosted checkout
- [ ] Pay with a sandbox test method, confirm redirect back to `/orders/[id]/confirmation?redirected=1`
- [ ] Confirm webhook fires, order flips to `confirmed` in DB, confirmation page shows success, confirmation email sends
- [ ] Confirm cart is cleared only after payment is confirmed (not on redirect alone)

## 5. Checkout failure path

- [ ] Deliberately fail/abandon a sandbox payment, confirm confirmation page shows the failed state with a retry link
- [ ] Confirm order stays `placed` (not stuck as ambiguous state)

## 6. Idempotency & webhook retries

- [ ] Manually resend the same webhook payload twice, confirm no duplicate email / no duplicate `order_status_history` row
- [ ] Confirm invalid/missing `x-webhook-signature` is rejected with 400

## 7. Refunds

- [ ] Trigger a refund from the Cashfree dashboard for a confirmed test order
- [ ] Confirm `REFUND_STATUS_WEBHOOK` flips order to `refunded` with `refundId`/`refundedAmount` set

## 8. Incident blocking

- [ ] Confirm `hasActiveHighImpactIncident()` correctly returns `false` in the normal case (no live incident to test the `true` case against in sandbox)
- [ ] Manually verify `POST /api/orders` returns `503 payment_incident` if you temporarily force the check to return `true`

## 9. Shipping / tracking

- [ ] From Sanity Studio → "Ship Order" tool, ship a `confirmed` test order with a tracking URL + `ADMIN_API_SECRET`
- [ ] Confirm order flips to `shipped`, "Track package" button appears on the customer's Order Status page and opens the URL in a new tab
- [ ] Confirm shipping without a tracking URL returns `400`
- [ ] Confirm shipping a non-`confirmed` order (e.g. already `shipped`) returns `409`
- [ ] Confirm a wrong/missing `x-admin-secret` returns `401`

## 10. Production readiness (before going live)

- [ ] Swap to production Cashfree keys (`CASHFREE_ENV=production`), register the production webhook URL separately
- [ ] Rotate `ADMIN_API_SECRET` from whatever was used in sandbox testing
