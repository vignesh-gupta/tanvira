import Link from "next/link"

export default function RootNotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <p className="font-heading text-5xl text-primary">404</p>
      <p className="text-lg">We couldn&apos;t find that page</p>
      <Link href="/" className="text-sm text-primary underline">
        Back to home
      </Link>
    </div>
  )
}
