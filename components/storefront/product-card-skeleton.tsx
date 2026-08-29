import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-sm">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
