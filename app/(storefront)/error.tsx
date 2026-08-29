"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-heading text-5xl text-primary">500</p>
      <p className="text-lg text-foreground">Something went wrong</p>
      <p className="text-sm text-muted-foreground">
        That&apos;s on us — please try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
