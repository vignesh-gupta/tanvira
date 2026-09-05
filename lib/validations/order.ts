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

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>

export const createOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1),
    promoCode: z
      .string()
      .trim()
      .toUpperCase()
      .optional(),
    // Exactly one of these — an existing saved address, or a new one to
    // save and use (see components/storefront/checkout-steps.tsx's saved
    // address cards + add-new form).
    addressId: z.string().uuid().optional(),
    shippingAddress: shippingAddressSchema.optional(),
  })
  .refine((data) => !!data.addressId !== !!data.shippingAddress, {
    message: "Provide either a saved addressId or a new shippingAddress, not both.",
  })

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const upsertAddressSchema = shippingAddressSchema.extend({
  isDefault: z.boolean().optional(),
})

export type UpsertAddressInput = z.infer<typeof upsertAddressSchema>

// Tracking URL is mandatory here — an order can't be marked "shipped"
// without one, since that's the only way the customer can follow their
// package (see app/api/orders/[id]/ship/route.ts).
export const shipOrderSchema = z.object({
  trackingUrl: z.string().trim().url(),
})

export type ShipOrderInput = z.infer<typeof shipOrderSchema>
