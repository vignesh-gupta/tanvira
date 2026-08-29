# Single image for the whole app — Tanvira is one Next.js project
# (App Router pages + Route Handlers + Server Actions), not a separate
# frontend/backend pair, so there is only one Dockerfile/service.

FROM node:22-alpine AS base
RUN corepack enable

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are public (embedded in the client bundle either way)
# and are needed for real here, not as placeholders: any page Next.js
# decides to prerender at build time will actually call Sanity with them.
# Pass the real values via --build-arg; everything secret (DATABASE_URL,
# RAZORPAY_*, RESEND_API_KEY, BETTER_AUTH_SECRET) stays runtime-only via
# env_file/platform env vars and is never baked into the image.
ARG NEXT_PUBLIC_SANITY_PROJECT_ID
ARG NEXT_PUBLIC_SANITY_DATASET=production
ENV NEXT_PUBLIC_SANITY_PROJECT_ID=$NEXT_PUBLIC_SANITY_PROJECT_ID
ENV NEXT_PUBLIC_SANITY_DATASET=$NEXT_PUBLIC_SANITY_DATASET
RUN pnpm run build

# ---- runtime ----
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
