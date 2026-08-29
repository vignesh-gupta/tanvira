import { Geist_Mono, Inter, Playfair_Display } from "next/font/google"

import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import { SanityLive } from "@/sanity/lib/live"
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600"],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        playfair.variable,
      )}
    >
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <SanityLive />
      </body>
    </html>
  )
}
