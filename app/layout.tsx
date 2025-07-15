import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { EntityProvider } from "@/lib/context/entity-context"
import { AuthProvider } from "@/lib/context/auth-context"
import { UserProvider } from "@/lib/context/user-context"
import { Toaster } from "@/components/ui/toaster"
import Providers from "./providers"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "PropertyPro - Rental Management System",
  description: "Comprehensive multi-tenant property management solution",
  generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-outfit`}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <UserProvider>
              <AuthProvider>
                <EntityProvider>{children}</EntityProvider>
              </AuthProvider>
            </UserProvider>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
