import { z } from "zod"

// A line item is a snapshot at order time (name/price included, not just a
// productId reference) — see DB_SCHEMA.md § Postgres — Order, "Denormalisation".
export const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().nonnegative(), // paise
  qty: z.number().int().positive(),
})

export const shippingAddressSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(4).max(10),
  // Delivery-contact field only — never used for authentication.
  phone: z.string().min(7).max(15),
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  promoCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional(),
  shippingAddress: shippingAddressSchema,
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

// Tracking URL is mandatory here — an order can't be marked "shipped"
// without one, since that's the only way the customer can follow their
// package (see app/api/orders/[id]/ship/route.ts).
export const shipOrderSchema = z.object({
  trackingUrl: z.string().trim().url(),
})

export type ShipOrderInput = z.infer<typeof shipOrderSchema>
