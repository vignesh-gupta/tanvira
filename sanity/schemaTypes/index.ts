import { product } from "./product"
import { category } from "./category"
import { banner } from "./banner"
import { promoCode } from "./promo-code"
import { type SchemaTypeDefinition } from "sanity"

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    product,
    category,
    banner,
    promoCode,
  ],
}
