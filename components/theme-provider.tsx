"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Storefront is light-only — no dark palette to switch to, so the theme is
// forced rather than left to system/localStorage preference.
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" forcedTheme="light" {...props}>
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
