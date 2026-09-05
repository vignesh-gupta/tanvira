"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ShippingAddressInput } from "@/lib/validations/order"

export type AddressFormValues = ShippingAddressInput

const EMPTY_ADDRESS: AddressFormValues = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
}

export function AddressForm({
  initialValue,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initialValue?: AddressFormValues
  submitLabel: string
  submitting?: boolean
  onSubmit: (values: AddressFormValues) => void
  onCancel?: () => void
}) {
  const [address, setAddress] = useState<AddressFormValues>(initialValue ?? EMPTY_ADDRESS)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(address)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="line1">Address line 1</Label>
        <Input
          id="line1"
          required
          value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="line2">Address line 2 (optional)</Label>
        <Input
          id="line2"
          value={address.line2}
          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            required
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            required
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pincode">PIN</Label>
          <Input
            id="pincode"
            required
            value={address.pincode}
            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (for delivery contact)</Label>
        <Input
          id="phone"
          required
          value={address.phone}
          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}
