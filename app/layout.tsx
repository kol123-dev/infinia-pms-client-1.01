import type React from "react"
import type { Metadata, Viewport } from "next" // Add Viewport import
import { Outfit } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { EntityProvider } from "@/lib/context/entity-context"
import { AuthProvider } from "@/lib/context/auth-context"
import { UserProvider } from "@/lib/context/user-context"
import { Toaster } from "@/components/ui/toaster"
import Providers from "./providers"
import { SessionProvider } from "next-auth/react"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "Infinia sync - Property Management System",
  description: "Comprehensive multi-tenant property management solution",
  generator: 'v0.dev',
  manifest: "/manifest.json", // Add this line to link to your manifest file
}

// Add this viewport export
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-outfit`}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <UserProvider>
              <AuthProvider>
                <EntityProvider>
                  {children}
                  <Toaster />
                </EntityProvider>
              </AuthProvider>
            </UserProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}