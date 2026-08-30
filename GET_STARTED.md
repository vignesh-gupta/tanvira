# Getting Started

Setup guide for running Tanvira locally. For architecture/design context see [ARCHITECTURE.md](./ARCHITECTURE.md), [PRD.md](./PRD.md), and [DESIGN.md](./DESIGN.md). For post-Cashfree-migration verification steps, see [TASKS.md](./TASKS.md).

## Prerequisites

- Node.js 22+
- pnpm (`corepack enable` will pick up the right version)
- A Postgres database — [Neon](https://neon.tech) free tier works well (serverless driver is already wired up in `db/index.ts`)
- A [Sanity](https://sanity.io) project (free tier)

## 1. Install

```bash
pnpm install
```

## 2. Environment variables

Copy the template and fill it in:

```bash
cp .env.example .env
```

`.env.example` is the source of truth for every variable this app reads — the list below just explains what each group is for and where to get the values.

### Required to run the app at all

| Variable                                          | Where to get it                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`                   | Sanity project settings (or `npx sanity init` if you don't have one yet)                                              |
| `NEXT_PUBLIC_SANITY_DATASET`                      | Usually `production`                                                                                                  |
| `DATABASE_URL`                                    | Your Postgres connection string (Neon dashboard → Connection Details)                                                 |
| `BETTER_AUTH_SECRET`                              | Generate with `npx auth secret` or `openssl rand -base64 32`                                                          |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` | `http://localhost:3000` for local dev                                                                                 |
| `RESEND_API_KEY`                                  | [Resend](https://resend.com) dashboard — used for OTP login and order confirmation emails                             |
| `EMAIL_FROM`                                      | Any sender string, e.g. `"Tanvira <onboarding@resend.dev>"` (Resend's shared domain works without verifying your own) |

### Required to actually complete a checkout

| Variable                                        | Where to get it                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `CASHFREE_CLIENT_ID` / `CASHFREE_CLIENT_SECRET` | Cashfree dashboard → API Keys (use **sandbox** keys for local dev)   |
| `CASHFREE_ENV`                                  | `sandbox` locally, `production` when live                            |
| `NEXT_PUBLIC_CASHFREE_ENV`                      | Same value as `CASHFREE_ENV` (the checkout SDK needs it client-side) |

Without these, everything except payment works — the site loads, cart/auth/promo codes/CMS content all function; `POST /api/orders` will fail once it tries to call Cashfree.

### Required to use the "Ship Order" tool

| Variable           | Where to get it                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_API_SECRET` | Any random string you pick — entered once into the Sanity Studio "Ship Order" tool (see [ARCHITECTURE.md](./ARCHITECTURE.md) § Security Model for why this exists instead of a real admin role) |

### Optional

| Variable           | Where to get it                                  | Needed for                                                 |
| ------------------ | ------------------------------------------------ | ---------------------------------------------------------- |
| `SANITY_API_TOKEN` | Sanity project → API → Tokens (**write**-scoped) | Only `pnpm sanity:seed` — not needed to browse/run the app |

## 3. Database setup

Apply the schema, then seed some demo data:

```bash
pnpm db:migrate
pnpm db:seed
```

`db:seed` is safe to re-run (every insert is idempotent) and gives you a few demo users/orders in every status (placed, confirmed, shipped, etc.) so the storefront isn't empty on first run.

Other DB scripts, if you need them:

- `pnpm db:generate` — after changing `db/schema.ts`, generates a new migration (don't hand-edit files under `drizzle/`)
- `pnpm db:push` — push schema straight to the DB without a migration file (quick local iteration, skip for anything you intend to commit)
- `pnpm db:reset` — drops everything; only use on a throwaway dev DB

## 4. Sanity content (optional but recommended)

The storefront reads products/categories/banners/promo codes from Sanity. If your Sanity dataset is empty:

```bash
# add SANITY_API_TOKEN to .env first — see "Optional" above
pnpm sanity:seed
```

This seeds a handful of demo products/categories/banners/promo codes (reusing one placeholder product image, since no real photography is bundled — see the comment at the top of `sanity/seed.ts`).

Sanity Studio itself is embedded in the app at `/studio` — no separate deploy needed.

## 5. Run it

```bash
pnpm dev
```

- Storefront: http://localhost:3000
- Sanity Studio: http://localhost:3000/studio

## 6. Testing payments locally (optional)

Cashfree's checkout redirect works fine on `localhost` (it's just your browser navigating back), but **webhooks are server-to-server** — Cashfree can't reach `localhost` directly. To exercise the full webhook-confirmed flow:

1. Expose your dev server with a tunnel, e.g. `ngrok http 3000`
2. In the Cashfree dashboard, register the tunnel's URL + `/api/webhooks/cashfree` as the webhook endpoint
3. Use Cashfree's sandbox test cards/UPI IDs to complete a payment

See [TASKS.md](./TASKS.md) for the full checklist of what to verify end-to-end.

## 7. Docker (optional)

A single-image Dockerfile is provided at `infra/Dockerfile` (see its comments for which env vars are build-args vs. runtime-only secrets):

```bash
docker build -t tanvira \
  --build-arg NEXT_PUBLIC_SANITY_PROJECT_ID=<id> \
  --build-arg NEXT_PUBLIC_SANITY_DATASET=production \
  -f infra/Dockerfile .
docker run -p 3000:3000 --env-file .env tanvira
```

## Useful scripts

| Command                     | Purpose                   |
| --------------------------- | ------------------------- |
| `pnpm dev`                  | Start the dev server      |
| `pnpm build` / `pnpm start` | Production build / run it |
| `pnpm lint` / `pnpm format` | ESLint / Prettier         |
| `pnpm typecheck`            | `tsc --noEmit`            |
