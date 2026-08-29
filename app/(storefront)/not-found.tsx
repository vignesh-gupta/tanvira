import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-heading text-5xl text-primary">404</p>
      <p className="text-lg text-foreground">We couldn&apos;t find that page</p>
      <p className="text-sm text-muted-foreground">
        The link might be broken, or the page may have moved.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  )
}
