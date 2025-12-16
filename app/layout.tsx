import type React from "react"
import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { EntityProvider } from "@/lib/context/entity-context"
import { AuthProvider } from "@/lib/context/auth-context"
import { UserProvider } from "@/lib/context/user-context"
import { Toaster } from "@/components/ui/toaster"
import Providers from "./providers"
import { SpeedInsights } from "@vercel/speed-insights/next"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "Infinia sync - Property Management System",
  description: "Comprehensive multi-tenant property management solution",
  generator: 'v0.dev',
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/icon-16x16.png", sizes: "16x16" },
      { url: "/icons/icon-32x32.png", sizes: "32x32" },
      { url: "/icons/icon-48x48.png", sizes: "48x48" },
      { url: "/icons/icon-180x180.png", sizes: "180x180" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", sizes: "512x512" },
    ],
    apple: "/icons/icon-180x180.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-outfit min-h-[100dvh] bg-background`}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <UserProvider>
              <AuthProvider>
                <EntityProvider>
                  <>
                    {children}
                    <SpeedInsights />
                    <Toaster />
                  </>
                </EntityProvider>
              </AuthProvider>
            </UserProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
