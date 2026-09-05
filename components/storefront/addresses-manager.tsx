"use client"

import { useState } from "react"
import { MapPinOff, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { AddressCard, type AddressData } from "@/components/storefront/address-card"
import { AddressForm, type AddressFormValues } from "@/components/storefront/address-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAddresses, useCreateAddress, useDeleteAddress, useUpdateAddress } from "@/lib/addresses/queries"

export function AddressesManager() {
  const { data: addresses } = useAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<AddressData | null>(null)
  const [deleting, setDeleting] = useState<AddressData | null>(null)

  function handleAdd(values: AddressFormValues) {
    createAddress.mutate(values, {
      onSuccess: () => {
        toast.success("Address added")
        setAdding(false)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  function handleEdit(values: AddressFormValues) {
    if (!editing) return
    updateAddress.mutate(
      { id: editing.id, values },
      {
        onSuccess: () => {
          toast.success("Address updated")
          setEditing(null)
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  function handleDelete() {
    if (!deleting) return
    deleteAddress.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Address deleted")
        setDeleting(null)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  if (addresses === undefined) {
    return <p className="text-sm text-muted-foreground">Loading your addresses…</p>
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !adding ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <MapPinOff className="size-10 text-muted-foreground" />
          <p className="text-lg text-foreground">No saved addresses yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              actions={
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit address"
                    onClick={() => setEditing(address)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete address"
                    onClick={() => setDeleting(address)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {adding ? (
        <AddressForm
          submitLabel="Save address"
          submitting={createAddress.isPending}
          onSubmit={handleAdd}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
          + Add a new address
        </Button>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit address</DialogTitle>
          </DialogHeader>
          {editing ? (
            <AddressForm
              initialValue={{ ...editing, line2: editing.line2 ?? undefined }}
              submitLabel="Save changes"
              submitting={updateAddress.isPending}
              onSubmit={handleEdit}
              onCancel={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this address?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. Addresses used by a past order can&apos;t be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteAddress.isPending}>
              {deleteAddress.isPending ? "Deleting…" : "Delete address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
