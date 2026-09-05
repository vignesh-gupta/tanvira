import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface AppliedPromo {
  code: string
  discountAmount: number // paise
}

interface PromoStore {
  promo: AppliedPromo | null
  setPromo: (promo: AppliedPromo | null) => void
  clear: () => void
}

// Global (not per-page) so a promo applied on the cart page, or auto-applied
// from a `?promo=` URL param on any storefront page, is still there at
// checkout — see components/storefront/promo-url-sync.tsx for the URL side.
export const usePromoStore = create<PromoStore>()(
  persist(
    (set) => ({
      promo: null,
      setPromo: (promo) => set({ promo }),
      clear: () => set({ promo: null }),
    }),
    { name: "tanvira-promo" },
  ),
)
