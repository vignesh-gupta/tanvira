import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

export type AddressData = {
  id: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  phone: string
  isDefault: boolean
}

export function AddressCard({
  address,
  selected,
  onSelect,
  actions,
}: {
  address: AddressData
  selected?: boolean
  onSelect?: () => void
  actions?: React.ReactNode
}) {
  const Wrapper = onSelect ? "button" : "div"

  return (
    <Wrapper
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-4 text-left text-sm transition-colors",
        onSelect && "cursor-pointer hover:border-primary/50",
        selected ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">
            {address.line1}
            {address.isDefault ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Star className="size-3 fill-current" /> Default
              </span>
            ) : null}
          </p>
          {address.line2 ? <p className="text-muted-foreground">{address.line2}</p> : null}
          <p className="text-muted-foreground">
            {address.city}, {address.state} {address.pincode}
          </p>
          <p className="text-muted-foreground">{address.phone}</p>
        </div>
        {actions}
      </div>
    </Wrapper>
  )
}
